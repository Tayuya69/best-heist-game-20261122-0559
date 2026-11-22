// NIGHT VAULT — sound, synthesised.
// No audio files: every sound is a small WebAudio patch built on the fly.
// The context is created on the first key or click, because browsers do
// not let a page play sound before the player has touched it.

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensureContext() {
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureContext();
}

function tone(frequency, seconds, type, gainValue, slideTo) {
  if (muted) return;
  const audio = ensureContext();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(frequency, audio.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, audio.currentTime + seconds);
  gain.gain.setValueAtTime(gainValue || 0.08, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + seconds);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + seconds);
}

function noise(seconds, gainValue, filterFrequency) {
  if (muted) return;
  const audio = ensureContext();
  if (!audio) return;
  const length = Math.floor(audio.sampleRate * seconds);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFrequency || 1200;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(gainValue || 0.05, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + seconds);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  source.start();
}

export const sounds = {
  step() {
    noise(0.05, 0.02, 500);
  },
  pickup() {
    tone(880, 0.12, 'sine', 0.07);
    setTimeout(() => tone(1318, 0.18, 'sine', 0.07), 70);
  },
  keycard() {
    noise(0.18, 0.05, 3200);
    setTimeout(() => tone(1046, 0.12, 'sine', 0.06), 120);
  },
  unlock() {
    tone(220, 0.1, 'square', 0.05);
    setTimeout(() => tone(660, 0.16, 'sine', 0.07), 90);
  },
  dialLock() {
    tone(1568, 0.1, 'triangle', 0.09);
  },
  dialMiss() {
    tone(160, 0.25, 'sawtooth', 0.08, 90);
  },
  vaultOpen() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.08), i * 90));
  },
  alarm() {
    tone(740, 0.3, 'sawtooth', 0.06, 980);
  },
  caught() {
    tone(220, 0.5, 'sawtooth', 0.09, 55);
    noise(0.4, 0.06, 800);
  },
  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.08), i * 110));
  },
  lose() {
    tone(196, 0.9, 'sine', 0.08, 98);
  },
  click() {
    tone(1200, 0.05, 'sine', 0.05);
  },
};
