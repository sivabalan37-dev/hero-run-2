export class AudioManager {
  constructor() { this.context = null; this.enabled = true; }
  async resume() {
    if (!this.enabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context ??= new AudioContextClass();
    if (this.context.state === 'suspended') await this.context.resume();
  }
  tone(frequency, duration = 0.09, type = 'sine', volume = 0.035) {
    if (!this.enabled || !this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    oscillator.connect(gain); gain.connect(this.context.destination);
    oscillator.start(); oscillator.stop(this.context.currentTime + duration);
  }
  coin() { this.tone(880, 0.06, 'triangle'); setTimeout(() => this.tone(1240, 0.07, 'triangle'), 45); }
  hit() { this.tone(150, 0.16, 'sawtooth', 0.045); }
  jump() { this.tone(380, 0.11, 'sine'); }
  power() { this.tone(540, 0.1, 'triangle'); setTimeout(() => this.tone(760, 0.13, 'triangle'), 80); }
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
