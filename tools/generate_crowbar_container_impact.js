const fs = require("fs");
const path = require("path");

const sampleRate = 44100;
const duration = 1.35;
const sampleCount = Math.round(sampleRate * duration);
const samples = new Float64Array(sampleCount);

let seed = 0x4b1d2a37;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0x100000000 * 2 - 1;
}

function addMode(start, frequency, decay, gain, phase = 0) {
  const startSample = Math.round(start * sampleRate);
  for (let i = startSample; i < sampleCount; i++) {
    const t = (i - startSample) / sampleRate;
    samples[i] += gain * Math.exp(-t / decay) * Math.sin(2 * Math.PI * frequency * t + phase);
  }
}

function addImpact(start, gain) {
  const startSample = Math.round(start * sampleRate);
  let low = 0;
  let previous = 0;
  const length = Math.round(0.065 * sampleRate);
  for (let j = 0; j < length && startSample + j < sampleCount; j++) {
    const t = j / sampleRate;
    const noise = random();
    low += 0.19 * (noise - low);
    const edged = noise - 0.72 * previous;
    previous = noise;
    const envelope = Math.exp(-t / 0.011) * (1 - Math.exp(-t / 0.00045));
    samples[startSample + j] += gain * envelope * (0.87 * low + 0.13 * edged);
  }
}

// Heavy initial contact and a smaller seating clack as the bar enters the seam.
addImpact(0.012, 1.0);
addImpact(0.092, 0.36);

// Crowbar ring: deliberately inharmonic steel modes.
[
  [548, 0.18, 0.22],
  [821, 0.14, 0.15],
  [1267, 0.10, 0.095],
  [1931, 0.072, 0.052],
  [2897, 0.045, 0.025],
  [4213, 0.030, 0.010],
].forEach(([frequency, decay, gain], index) => {
  addMode(0.012, frequency, decay, gain, index * 0.71);
});

// Broad container-door panel resonance.
[
  [72, 0.57, 0.21],
  [113, 0.49, 0.17],
  [176, 0.38, 0.14],
  [263, 0.28, 0.090],
  [389, 0.21, 0.050],
].forEach(([frequency, decay, gain], index) => {
  addMode(0.015, frequency, decay, gain, 0.4 + index * 0.83);
});

// Short grinding scrape while the crowbar wedges into the narrow door gap.
let scrapeLow = 0;
let scrapePrevious = 0;
const scrapeStart = Math.round(0.027 * sampleRate);
const scrapeLength = Math.round(0.205 * sampleRate);
for (let j = 0; j < scrapeLength; j++) {
  const t = j / sampleRate;
  const noise = random();
  scrapeLow += 0.31 * (noise - scrapeLow);
  const band = scrapeLow - scrapePrevious;
  scrapePrevious += 0.055 * (scrapeLow - scrapePrevious);
  const shape = Math.sin(Math.PI * Math.min(1, t / 0.205));
  const chatter = 0.66 + 0.34 * Math.max(0, Math.sin(2 * Math.PI * (31 + 75 * t) * t));
  samples[scrapeStart + j] += 0.115 * shape * chatter * band;
}

// A few tiny edge catches make the scrape feel mechanical instead of continuous noise.
[0.049, 0.073, 0.118, 0.161].forEach((start, index) => {
  addMode(start, 1560 + index * 271, 0.014, 0.022, index);
  addMode(start, 2760 + index * 193, 0.009, 0.009, index * 0.4);
});

// A soft low-pass makes the impact sound weighty and partially enclosed.
let lowPass = 0;
let lowPass2 = 0;
const lowPassCoefficient = 1 - Math.exp(-2 * Math.PI * 2850 / sampleRate);
for (let i = 0; i < sampleCount; i++) {
  lowPass += lowPassCoefficient * (samples[i] - lowPass);
  lowPass2 += lowPassCoefficient * (lowPass - lowPass2);
  samples[i] = lowPass2;
}

// Gentle saturation, peak normalization, and short fades.
let peak = 0;
for (let i = 0; i < sampleCount; i++) {
  samples[i] = Math.tanh(samples[i] * 1.35);
  peak = Math.max(peak, Math.abs(samples[i]));
}
const scale = 0.92 / peak;
const fadeOutStart = Math.round((duration - 0.12) * sampleRate);
for (let i = 0; i < sampleCount; i++) {
  let fade = 1;
  if (i < 32) fade = i / 32;
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
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
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

const outputPath = path.resolve(__dirname, "../asset/audio/se/action/crowbar_container_door_impact.wav");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, buffer);
console.log(outputPath);
