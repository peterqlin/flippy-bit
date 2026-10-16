export type SoundEffect = 'bitSet' | 'bitCleared' | 'explosion';

const MASTER_VOLUME = 1.25;
const SILENT = 0.0001;

let audio: { context: AudioContext; output: GainNode; noise: AudioBuffer } | null = null;
let muted = false;

export function setSoundEffectsMuted(isMuted: boolean) {
  muted = isMuted;
}

/** Created on first use, which is always a player's key press or tap, so browsers allow it to play. */
function audioOutput() {
  if (!audio) {
    if (typeof AudioContext === 'undefined') return null;
    const context = new AudioContext();
    const output = context.createGain();
    output.gain.value = MASTER_VOLUME;
    output.connect(context.destination);
    audio = { context, output, noise: whiteNoise(context, 0.5) };
  }
  if (audio.context.state === 'suspended') void audio.context.resume();
  return audio;
}

export function playSoundEffect(effect: SoundEffect) {
  if (muted) return;
  const output = audioOutput();
  if (!output) return;
  const { context } = output;
  const now = context.currentTime;
  switch (effect) {
    case 'bitSet':
      blip(context, output.output, now, 660, 990);
      break;
    case 'bitCleared':
      blip(context, output.output, now, 520, 350);
      break;
    case 'explosion':
      noiseBurst(context, output.output, output.noise, now);
      thump(context, output.output, now);
      break;
  }
}

function blip(context: AudioContext, output: AudioNode, at: number, fromHz: number, toHz: number) {
  const oscillator = context.createOscillator();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(fromHz, at);
  oscillator.frequency.exponentialRampToValueAtTime(toHz, at + 0.05);
  const gain = envelope(context, at, 0.08, 0.07);
  oscillator.connect(gain).connect(output);
  oscillator.start(at);
  oscillator.stop(at + 0.08);
}

function noiseBurst(context: AudioContext, output: AudioNode, noise: AudioBuffer, at: number) {
  const source = context.createBufferSource();
  source.buffer = noise;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2400, at);
  filter.frequency.exponentialRampToValueAtTime(150, at + 0.35);
  const gain = envelope(context, at, 0.35, 0.4);
  source.connect(filter).connect(gain).connect(output);
  source.start(at);
  source.stop(at + 0.4);
}

function thump(context: AudioContext, output: AudioNode, at: number) {
  const oscillator = context.createOscillator();
  oscillator.frequency.setValueAtTime(120, at);
  oscillator.frequency.exponentialRampToValueAtTime(40, at + 0.2);
  const gain = envelope(context, at, 0.4, 0.22);
  oscillator.connect(gain).connect(output);
  oscillator.start(at);
  oscillator.stop(at + 0.25);
}

/** Starts at `peak` and decays exponentially to silence over `durationS`. */
function envelope(context: AudioContext, at: number, peak: number, durationS: number) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(peak, at);
  gain.gain.exponentialRampToValueAtTime(SILENT, at + durationS);
  return gain;
}

function whiteNoise(context: AudioContext, durationS: number) {
  const buffer = context.createBuffer(1, context.sampleRate * durationS, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  return buffer;
}
