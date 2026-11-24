export class AudioManager {
  constructor({ enabled = true, volume = 0.65 } = {}) {
    this.context = null;
    this.enabled = enabled;
    this.volume = Math.max(0, Math.min(1, Number(volume) || 0));
  }
  setEnabled(enabled) { this.enabled = Boolean(enabled); }
  setVolume(volume) {
    const value = Number(volume);
    if (Number.isFinite(value)) this.volume = Math.max(0, Math.min(1, value));
  }
  async resume() {
    if (!this.enabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context ??= new AudioContextClass();
    if (this.context.state === 'suspended') await this.context.resume();
  }
  tone(frequency, duration = 0.09, type = 'sine', volume = 0.035) {
    if (!this.enabled || !this.context || this.volume <= 0) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume * this.volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    oscillator.connect(gain); gain.connect(this.context.destination);
    oscillator.start(); oscillator.stop(this.context.currentTime + duration);
  }
  coin() { this.tone(880, 0.06, 'triangle'); setTimeout(() => this.tone(1240, 0.07, 'triangle'), 45); }
  hit() { this.tone(150, 0.16, 'sawtooth', 0.045); }
  jump() { this.tone(380, 0.11, 'sine'); }
  power() { this.tone(540, 0.1, 'triangle'); setTimeout(() => this.tone(760, 0.13, 'triangle'), 80); }
  formShift() {
    this.tone(420, 0.09, 'sine', 0.04);
    setTimeout(() => this.tone(620, 0.11, 'triangle', 0.045), 65);
    setTimeout(() => this.tone(880, 0.16, 'triangle', 0.04), 130);
  }
  gadgetScan() {
    this.tone(680, 0.12, 'sine', 0.03);
    setTimeout(() => this.tone(920, 0.18, 'sine', 0.035), 100);
  }
  airDash() {
    this.tone(260, 0.07, 'sawtooth', 0.025);
    setTimeout(() => this.tone(720, 0.12, 'triangle', 0.04), 45);
  }
  levelComplete() {
    [523, 659, 784, 1046].forEach((note, index) => {
      setTimeout(() => this.tone(note, 0.2, 'triangle', 0.045), index * 115);
    });
  }
  gameOver() {
    this.tone(330, 0.18, 'sine', 0.04);
    setTimeout(() => this.tone(247, 0.24, 'sine', 0.035), 150);
  }
  bossWarning(attackType) {
    const notes = {
      'ground-slam': 220,
      'gear-dash': 330,
      'vine-sweep': 280,
      'pulse-blast': 440,
      'time-wave': 520,
    };
    this.tone(notes[attackType] || 260, 0.22, 'sawtooth', 0.045);
  }
  bossAttack(attackType) {
    const notes = {
      'ground-slam': 92,
      'gear-dash': 180,
      'vine-sweep': 140,
      'pulse-blast': 660,
      'time-wave': 360,
    };
    this.tone(notes[attackType] || 160, 0.2, 'triangle', 0.055);
  }
}

  destroy() {
    const context = this.context;
    this.context = null;
    if (!context || context.state === 'closed' || typeof context.close !== 'function') return;

    try {
      const closing = context.close();
      closing?.catch?.(() => {});
    } catch {
      // Audio teardown must not interrupt renderer and scene cleanup.
    }
  }
