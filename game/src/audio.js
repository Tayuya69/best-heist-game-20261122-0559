// audio.js — synthesised sound, no audio files: WebAudio oscillators only.
// Footsteps, a pickup chime, the alarm sting, the win jingle. Mute with M.
// Everything is wrapped in try/catch: a browser without audio still plays.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = 0.16;
  }

  ensureContext() {
    if (this.ctx) return this.ctx;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  // Start audio on the first user gesture (browsers block it before that).
  unlock() {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, duration, type = 'sine', volume = 1, slideTo = null) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
      gain.gain.setValueAtTime(this.master * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio is decoration; never let it break the game.
    }
  }

  footstep(sneaking) {
    this.tone(sneaking ? 90 : 140, 0.06, 'triangle', sneaking ? 0.25 : 0.5);
  }

  pickup() {
    this.tone(660, 0.12, 'sine', 0.9);
    setTimeout(() => this.tone(990, 0.18, 'sine', 0.9), 90);
  }

  sapphireCrack() {
    this.tone(520, 0.1, 'square', 0.35, 780);
  }

  alarmSting() {
    this.tone(220, 0.35, 'sawtooth', 0.8, 440);
    setTimeout(() => this.tone(220, 0.35, 'sawtooth', 0.8, 440), 180);
  }

  spotted() {
    this.tone(180, 0.25, 'sawtooth', 0.7, 320);
  }

  caught() {
    this.tone(160, 0.6, 'sawtooth', 0.9, 60);
  }

  win() {
    [523, 659, 784, 1046].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.22, 'sine', 0.9), i * 130);
    });
  }
}
