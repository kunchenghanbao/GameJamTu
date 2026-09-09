const fs = require("fs");
const path = require("path");

const sourcePath = process.argv[2];
const outputDir = process.argv[3] || path.resolve(__dirname, "../output/audio");

if (!sourcePath) {
  console.error("Usage: node tools/process_footstep_audio.js <source.wav> [output-dir]");
  process.exit(1);
}

function readWav(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("仅支持 RIFF/WAVE 音频");
  }
  let fmt = null;
  let data = null;
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === "fmt ") {
      fmt = {
        format: buffer.readUInt16LE(body),
        channels: buffer.readUInt16LE(body + 2),
        sampleRate: buffer.readUInt32LE(body + 4),
        blockAlign: buffer.readUInt16LE(body + 12),
        bitsPerSample: buffer.readUInt16LE(body + 14),
      };
    } else if (id === "data") {
      data = buffer.subarray(body, Math.min(body + size, buffer.length));
    }
    offset = body + size + (size & 1);
  }
  if (!fmt || !data) throw new Error("WAV 缺少 fmt 或 data 块");
  if (fmt.format !== 1 || fmt.bitsPerSample !== 16) {
    throw new Error(`需要 16-bit PCM WAV，实际格式=${fmt.format} 位深=${fmt.bitsPerSample}`);
  }
  const frameCount = Math.floor(data.length / fmt.blockAlign);
  const samples = new Float64Array(frameCount * fmt.channels);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = data.readInt16LE(i * 2) / 32768;
  }
  return { ...fmt, frameCount, samples };
}

function writeWav(filePath, channels, sampleRate, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

function downmix(input, channels, startFrame, endFrame) {
  const length = endFrame - startFrame;
  const mono = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    let value = 0;
    for (let c = 0; c < channels; c++) value += input[(startFrame + i) * channels + c];
    mono[i] = value / channels;
  }
  return mono;
}

function findOnset(input, channels, sampleRate, limitFrame) {
  const window = Math.max(1, Math.round(sampleRate * 0.004));
  const threshold = 0.008;
  for (let start = 0; start < limitFrame - window; start += Math.max(1, Math.floor(window / 2))) {
    let energy = 0;
    for (let i = 0; i < window; i++) {
      let value = 0;
      for (let c = 0; c < channels; c++) value += input[(start + i) * channels + c];
      value /= channels;
      energy += value * value;
    }
    if (Math.sqrt(energy / window) >= threshold) return start;
  }
  return 0;
}

function resample(input, speed) {
  const outputLength = Math.max(1, Math.round(input.length / speed));
  const output = new Float64Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const sourcePosition = i * speed;
    const left = Math.floor(sourcePosition);
    const right = Math.min(input.length - 1, left + 1);
    const fraction = sourcePosition - left;
    output[i] = input[left] * (1 - fraction) + input[right] * fraction;
  }
  return output;
}

function shapeUnit(input, gain, phase, sampleRate) {
  const output = new Float64Array(input.length);
  const attack = Math.max(1, Math.round(sampleRate * 0.003));
  const release = Math.max(1, Math.round(sampleRate * 0.11));
  for (let i = 0; i < input.length; i++) {
    let envelope = 1;
    if (i < attack) envelope *= i / attack;
    if (i >= input.length - release) envelope *= Math.max(0, (input.length - i) / release);
    // Very subtle intra-step movement: keeps repeated hits from sounding cloned.
    const microVariation = 1 + 0.012 * Math.sin((i / sampleRate) * Math.PI * 2 * 2.2 + phase);
    output[i] = input[i] * gain * envelope * microVariation;
  }
  return output;
}

const source = readWav(sourcePath);
const firstHalf = Math.floor(source.frameCount / 2);
const onset = findOnset(source.samples, source.channels, source.sampleRate, firstHalf);
// Keep the complete first half after the detected onset: this retains the impact
// and its natural decay while discarding the low-level lead-in silence.
const segmentStart = Math.max(0, onset - Math.round(source.sampleRate * 0.002));
const segmentEnd = firstHalf;
const segmentFrames = segmentEnd - segmentStart;
const segment = new Float64Array(segmentFrames * source.channels);
segment.set(source.samples.subarray(segmentStart * source.channels, segmentEnd * source.channels));

fs.mkdirSync(outputDir, { recursive: true });
const isolatedPath = path.join(outputDir, "impact_front_segment.wav");
const footstepsPath = path.join(outputDir, "footsteps_left_right.wav");
writeWav(isolatedPath, source.channels, source.sampleRate, segment);

const unit = downmix(source.samples, source.channels, segmentStart, segmentEnd);
const speeds = [1.000, 0.988, 1.012, 0.995, 1.008, 0.990];
const gains = [1.00, 0.94, 1.035, 0.965, 1.015, 0.95];
const stepCount = speeds.length;
const interval = Math.round(source.sampleRate * 0.43);
const units = speeds.map((speed, i) => shapeUnit(resample(unit, speed), gains[i], i * 1.7, source.sampleRate));
const outputFrames = (stepCount - 1) * interval + Math.max(...units.map((item) => item.length));
const footsteps = new Float64Array(outputFrames * 2);

for (let step = 0; step < stepCount; step++) {
  const pan = step % 2 === 0 ? -0.78 : 0.78;
  const leftPan = Math.cos((pan + 1) * Math.PI / 4);
  const rightPan = Math.sin((pan + 1) * Math.PI / 4);
  const start = step * interval;
  for (let i = 0; i < units[step].length && start + i < outputFrames; i++) {
    const value = units[step][i];
    footsteps[(start + i) * 2] += value * leftPan;
    footsteps[(start + i) * 2 + 1] += value * rightPan;
  }
}

let peak = 0;
for (const value of footsteps) peak = Math.max(peak, Math.abs(value));
if (peak > 0.90) {
  const scale = 0.90 / peak;
  for (let i = 0; i < footsteps.length; i++) footsteps[i] *= scale;
}
writeWav(footstepsPath, 2, source.sampleRate, footsteps);

const duration = (frames) => (frames / source.sampleRate).toFixed(3);
console.log(JSON.stringify({
  source: sourcePath,
  sourceDurationSeconds: duration(source.frameCount),
  selectedRangeSeconds: [duration(segmentStart), duration(segmentEnd)],
  isolated: isolatedPath,
  footsteps: footstepsPath,
  stepCount,
  alternatingPan: true,
  footstepsDurationSeconds: duration(outputFrames),
}, null, 2));
