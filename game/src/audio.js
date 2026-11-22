// NEON VAULT — The Golden Chip Job: synthesized sound.
// No audio files: every blip is a WebAudio oscillator, so the game loads
// nothing over the network. The casino hums a low synth pad while the
// thief works, and each action gets its own short note.

export function makeAudio() {
  return { ctx: null, muted: false, pad: null };
}

function ensure(a) {
  if (!a.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    a.ctx = new AC();
    // A low casino pad: two detuned sines, very quiet, looping.
    const gain = a.ctx.createGain();
    gain.gain.value = 0.03;
    gain.connect(a.ctx.destination);
    for (const freq of [110, 164.8]) {
      const osc = a.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start();
    }
    a.pad = gain;
  }
  if (a.ctx.state === 'suspended') a.ctx.resume();
  return a.ctx;
}

export function beep(a, freq, ms, type = 'sine', vol = 0.12) {
  if (a.muted) return;
  const ctx = ensure(a);
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + ms / 1000);
}

export const sfx = {
  pickup(a) { beep(a, 880, 120, 'sine', 0.12); },
  keycard(a) { beep(a, 660, 100, 'sine', 0.12); setTimeout(() => beep(a, 990, 140, 'sine', 0.12), 90); },
  alarm(a) { beep(a, 220, 200, 'sawtooth', 0.08); },
  chase(a) { beep(a, 440, 90, 'square', 0.07); setTimeout(() => beep(a, 330, 90, 'square', 0.07), 100); },
  caught(a) { beep(a, 180, 300, 'sawtooth', 0.12); },
  chip(a, i) { beep(a, [523, 659, 784, 1046][i] || 523, 160, 'sine', 0.14); },
  win(a) { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(a, f, 200, 'sine', 0.12), i * 130)); },
  click(a) { beep(a, 1200, 40, 'sine', 0.06); },
};
