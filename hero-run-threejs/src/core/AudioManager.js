export class AudioManager {
  constructor() { this.context = null; this.enabled = true; this.musicEnabled = true; this.timer = null; this.step = 0; }
  async resume() {
    const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
    this.context ??= new Ctx(); if (this.context.state === 'suspended') await this.context.resume();
    if (this.musicEnabled) this.startMusic();
  }
  tone(frequency, duration = 0.1, type = 'sine', volume = 0.025) {
    if (!this.enabled || !this.context) return;
    const osc = this.context.createOscillator(); const gain = this.context.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, this.context.currentTime);
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    osc.connect(gain); gain.connect(this.context.destination); osc.start(); osc.stop(this.context.currentTime + duration);
  }
  coin() { this.tone(880, 0.06, 'triangle'); setTimeout(() => this.tone(1240, 0.07, 'triangle'), 45); }
  jump() { this.tone(380, 0.12, 'sine'); }
  hit() { this.tone(180, 0.14, 'triangle', 0.035); }
  power() { this.tone(550, 0.1, 'triangle'); setTimeout(() => this.tone(790, 0.12, 'triangle'), 75); }
  startMusic() {
    if (!this.context || this.timer || !this.musicEnabled) return;
    const notes = [523,659,784,659,587,698,880,698];
    this.timer = setInterval(() => {
      this.tone(notes[this.step % notes.length], 0.2, 'sine', 0.006);
      if (this.step % 4 === 0) this.tone(notes[(this.step + 2) % notes.length] / 2, 0.32, 'triangle', 0.004);
      this.step += 1;
    }, 360);
  }
  stopMusic() { clearInterval(this.timer); this.timer = null; }
  setSound(value) { this.enabled = value; }
  setMusic(value) { this.musicEnabled = value; if (value) this.startMusic(); else this.stopMusic(); }
  dispose() { this.stopMusic(); this.context?.close(); this.context = null; }
}