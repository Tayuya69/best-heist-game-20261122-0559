// Sapphire Heist v2 — synthesised sound. WebAudio oscillators only, no
// audio files: pickup chimes, alarm stings, the vault crack, footsteps and
// the win / lose jingles. Created lazily on the first user gesture (browsers
// block audio before interaction) and silenced with M.
export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  pickup() {
    this.tone(880, 0.09, 'sine', 0.12);
    this.tone(1318, 0.14, 'sine', 0.1, 0.07);
  }

  coin() {
    this.tone(1174, 0.07, 'triangle', 0.1);
    this.tone(1568, 0.1, 'triangle', 0.09, 0.06);
  }

  keycard() {
    this.tone(523, 0.08, 'square', 0.06);
    this.tone(784, 0.12, 'square', 0.06, 0.08);
  }

  unlock() {
    this.tone(392, 0.1, 'triangle', 0.11);
    this.tone(523, 0.1, 'triangle', 0.11, 0.09);
    this.tone(659, 0.16, 'triangle', 0.11, 0.18);
  }

  alarmSting() {
    this.tone(220, 0.22, 'sawtooth', 0.09);
    this.tone(185, 0.26, 'sawtooth', 0.09, 0.16);
  }

  cameraBeep() {
    this.tone(1567, 0.06, 'square', 0.05);
  }

  crackGood() {
    this.tone(1046, 0.1, 'sine', 0.12);
    this.tone(1568, 0.16, 'sine', 0.11, 0.08);
  }

  crackBad() {
    this.tone(160, 0.25, 'sawtooth', 0.1);
  }

  hackDone() {
    this.tone(660, 0.08, 'triangle', 0.1);
    this.tone(880, 0.08, 'triangle', 0.1, 0.07);
    this.tone(1100, 0.14, 'triangle', 0.1, 0.14);
  }

  caught() {
    this.tone(330, 0.16, 'sawtooth', 0.11);
    this.tone(233, 0.16, 'sawtooth', 0.11, 0.13);
    this.tone(155, 0.3, 'sawtooth', 0.11, 0.26);
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.11, i * 0.11));
  }

  lose() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.1, i * 0.13));
  }

  // Soft footstep tick while the thief walks (called from the game loop).
  footstep(sneaking) {
    if (!this.ctx || this.muted) return;
    this.tone(sneaking ? 140 : 190, 0.045, 'sine', sneaking ? 0.03 : 0.05);
  }
}
