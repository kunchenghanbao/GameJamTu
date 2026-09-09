const fs = require("fs");
const path = require("path");

const sampleRate = 44100;
const duration = 2.8;
const sampleCount = Math.round(sampleRate * duration);
const samples = new Float64Array(sampleCount);

let seed = 0x73c19a4d;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000 * 2 - 1;
}

function smoothstep(edge0, edge1, value) {
  const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
}

function pulse(t, start, end, attack = 0.06, release = 0.1) {
  return smoothstep(start, start + attack, t) * (1 - smoothstep(end - release, end, t));
}

function addMode(start, frequency, decay, gain, phase = 0) {
  const startSample = Math.round(start * sampleRate);
  for (let i = startSample; i < sampleCount; i++) {
    const t = (i - startSample) / sampleRate;
    samples[i] += gain * Math.exp(-t / decay) * Math.sin(2 * Math.PI * frequency * t + phase);
  }
}

let phase = 0;
let phase2 = 0;
let noiseLow = 0;
let noiseSlower = 0;
let flutter = 0;

for (let i = 0; i < sampleCount; i++) {
  const t = i / sampleRate;
  const firstPull = pulse(t, 0.10, 1.34, 0.18, 0.23);
  const secondPull = pulse(t, 1.43, 2.56, 0.12, 0.28);
  const pressure = firstPull + 0.92 * secondPull;

  // Uneven leverage produces several stick-slip surges rather than a clean tone.
  const slip =
    0.72 +
    0.18 * Math.sin(2 * Math.PI * 4.2 * t + 0.7 * Math.sin(2 * Math.PI * 0.83 * t)) +
    0.10 * Math.sin(2 * Math.PI * 11.7 * t);
  flutter += 0.008 * (random() - flutter);

  const baseFrequency =
    365 - 82 * Math.min(1, t / duration) +
    47 * Math.sin(2 * Math.PI * 0.46 * t) +
    19 * Math.sin(2 * Math.PI * 2.15 * t) +
    flutter * 72;
  phase += 2 * Math.PI * baseFrequency / sampleRate;
  phase2 += 2 * Math.PI * (baseFrequency * 1.73 + 31 * Math.sin(2 * Math.PI * 0.7 * t)) / sampleRate;

  const groan =
    Math.sin(phase) +
    0.42 * Math.sin(2 * phase + 0.6) +
    0.17 * Math.sin(3 * phase + 1.7) +
    0.22 * Math.sin(phase2);

  const noise = random();
  noiseLow += 0.22 * (noise - noiseLow);
  noiseSlower += 0.035 * (noiseLow - noiseSlower);
  const scrapeBand = noiseLow - noiseSlower;

  // Slow panel flex under the bar supplies the heavy container-door body.
  const panel =
    0.58 * Math.sin(2 * Math.PI * 76 * t + 0.2) +
    0.34 * Math.sin(2 * Math.PI * 119 * t + 1.1) +
    0.19 * Math.sin(2 * Math.PI * 181 * t + 2.0);

  samples[i] += pressure * slip * (0.20 * groan + 0.12 * scrapeBand + 0.055 * panel);
}

// Short stress releases as the rusted seam shifts under load.
[
  [0.46, 0.85],
  [0.91, 0.62],
  [1.29, 0.50],
  [1.71, 0.76],
  [2.13, 0.58],
  [2.48, 0.68],
].forEach(([start, strength], index) => {
  addMode(start, 238 + index * 17, 0.075, 0.10 * strength, index * 0.6);
  addMode(start, 571 + index * 43, 0.052, 0.065 * strength, index * 0.9);
  addMode(start, 1043 + index * 71, 0.031, 0.030 * strength, index * 0.4);
});

// Muted clunks when pressure is applied and released.
[
  [0.10, 1.0],
  [1.42, 0.72],
  [2.53, 0.62],
].forEach(([start, strength]) => {
  const startSample = Math.round(start * sampleRate);
  let low = 0;
  for (let j = 0; j < Math.round(0.055 * sampleRate) && startSample + j < sampleCount; j++) {
    const t = j / sampleRate;
    low += 0.12 * (random() - low);
    samples[startSample + j] += strength * 0.22 * low * Math.exp(-t / 0.014);
  }
  addMode(start, 92, 0.22, 0.075 * strength);
  addMode(start, 147, 0.16, 0.052 * strength, 0.8);
});

// Roll off brittle highs to keep the sound heavy and enclosed.
let lowPass = 0;
let lowPass2 = 0;
const coefficient = 1 - Math.exp(-2 * Math.PI * 3600 / sampleRate);
for (let i = 0; i < sampleCount; i++) {
  lowPass += coefficient * (samples[i] - lowPass);
  lowPass2 += coefficient * (lowPass - lowPass2);
  samples[i] = Math.tanh(lowPass2 * 1.45);
}

let peak = 0;
for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
const scale = 0.91 / peak;
const fadeOutStart = Math.round((duration - 0.16) * sampleRate);
for (let i = 0; i < sampleCount; i++) {
  let fade = i < 48 ? i / 48 : 1;
  if (i >= fadeOutStart) fade *= (sampleCount - i - 1) / (sampleCount - fadeOutStart);
  samples[i] *= scale * Math.max(0, fade);
}

const dataSize = sampleCount * 2;
const buffer = Buffer.alloc(44 + dataSize);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < sampleCount; i++) {
  const value = Math.max(-1, Math.min(1, samples[i]));
  buffer.writeInt16LE(Math.round(value * (value < 0 ? 32768 : 32767)), 44 + i * 2);
}

const outputPath = path.resolve(__dirname, "../asset/audio/se/action/crowbar_container_door_creak.wav");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, buffer);
console.log(outputPath);
