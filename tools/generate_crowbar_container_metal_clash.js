const fs = require("fs");
const path = require("path");

const defaultReference = "C:/Users/TU/Desktop/\u7d20\u6750\u7247\u6bb5/\u94c1\u6876 \u549a \u6572\u51fb \u91d1\u5c5e \u97f3\u6548 (HQ).wav";
const inputPath = path.resolve(process.argv[2] || defaultReference);
const outputPath = path.resolve(__dirname, "../asset/audio/se/action/crowbar_container_metal_clash.wav");
const outputRate = 44100;
const outputDuration = 1.85;

function readPcm16Wave(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Reference must be a RIFF/WAVE file.");
  }

  let offset = 12;
  let format;
  let dataOffset;
  let dataSize;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === "fmt ") {
      format = {
        tag: buffer.readUInt16LE(offset + 8),
        channels: buffer.readUInt16LE(offset + 10),
        sampleRate: buffer.readUInt32LE(offset + 12),
        blockAlign: buffer.readUInt16LE(offset + 20),
        bits: buffer.readUInt16LE(offset + 22),
      };
    } else if (id === "data") {
      dataOffset = offset + 8;
      dataSize = size;
    }
    offset += 8 + size + (size & 1);
  }

  if (!format || dataOffset === undefined || format.tag !== 1 || format.bits !== 16) {
    throw new Error("Reference must use 16-bit PCM encoding.");
  }

  const frameCount = Math.floor(dataSize / format.blockAlign);
  const mono = new Float64Array(frameCount);
  for (let frame = 0; frame < frameCount; frame++) {
    let value = 0;
    for (let channel = 0; channel < format.channels; channel++) {
      value += buffer.readInt16LE(dataOffset + frame * format.blockAlign + channel * 2) / 32768;
    }
    mono[frame] = value / format.channels;
  }
  return { samples: mono, sampleRate: format.sampleRate };
}

function findOnset(samples, sampleRate) {
  const threshold = 0.018;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) >= threshold) {
      return Math.max(0, i - Math.round(0.026 * sampleRate));
    }
  }
  throw new Error("No audible impact found in reference.");
}

function interpolate(samples, position) {
  const index = Math.floor(position);
  const fraction = position - index;
  if (index < 0 || index + 1 >= samples.length) return 0;
  return samples[index] * (1 - fraction) + samples[index + 1] * fraction;
}

const reference = readPcm16Wave(inputPath);
const onset = findOnset(reference.samples, reference.sampleRate);
const outputCount = Math.round(outputRate * outputDuration);
const samples = new Float64Array(outputCount);
const rateRatio = reference.sampleRate / outputRate;

// Preserve the natural barrel strike, with a subtle faster layer for crowbar bite.
for (let i = 0; i < outputCount; i++) {
  const sourcePosition = onset + i * rateRatio;
  const natural = interpolate(reference.samples, sourcePosition);
  const steelBite = interpolate(reference.samples, onset + i * rateRatio * 1.045);
  const biteEnvelope = Math.exp(-i / outputRate / 0.19);
  samples[i] = natural + 0.12 * biteEnvelope * steelBite;
}

// Mild high-shelf emphasis retains the supplied thud but clarifies steel contact.
let low = 0;
const lowCoefficient = 1 - Math.exp(-2 * Math.PI * 620 / outputRate);
for (let i = 0; i < outputCount; i++) {
  low += lowCoefficient * (samples[i] - low);
  const high = samples[i] - low;
  samples[i] = low * 0.96 + high * 1.10;
}

// Remove residual DC, apply a very short fade, and normalize without clipping.
let mean = 0;
for (const sample of samples) mean += sample;
mean /= outputCount;
let peak = 0;
for (let i = 0; i < outputCount; i++) {
  samples[i] = Math.tanh((samples[i] - mean) * 1.08);
  peak = Math.max(peak, Math.abs(samples[i]));
}

const scale = 0.92 / peak;
const fadeInSamples = Math.round(0.004 * outputRate);
const fadeOutSamples = Math.round(0.12 * outputRate);
for (let i = 0; i < outputCount; i++) {
  let fade = i < fadeInSamples ? i / fadeInSamples : 1;
  if (i >= outputCount - fadeOutSamples) fade *= (outputCount - i - 1) / fadeOutSamples;
  samples[i] *= scale * Math.max(0, fade);
}

const dataSize = outputCount * 2;
const buffer = Buffer.alloc(44 + dataSize);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(outputRate, 24);
buffer.writeUInt32LE(outputRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < outputCount; i++) {
  const value = Math.max(-1, Math.min(1, samples[i]));
  buffer.writeInt16LE(Math.round(value * (value < 0 ? 32768 : 32767)), 44 + i * 2);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, buffer);
console.log(outputPath);
console.log(`Reference onset: ${(onset / reference.sampleRate).toFixed(3)} s`);
