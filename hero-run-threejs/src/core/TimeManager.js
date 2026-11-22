export class TimeManager {
  constructor() { this.last = performance.now(); this.delta = 0; this.elapsed = 0; }
  tick(now = performance.now()) {
    this.delta = Math.min((now - this.last) / 1000, 0.04);
    this.last = now; this.elapsed += this.delta; return this.delta;
  }
  reset() { this.last = performance.now(); this.delta = 0; }
}