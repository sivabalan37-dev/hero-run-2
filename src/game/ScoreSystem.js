export class ScoreSystem {
  constructor() { this.reset(); }
  reset() { this.score = 0; this.distance = 0; this.coins = 0; this.shards = 0; this.kills = 0; }
  updateDistance(distance) { this.distance = Math.max(this.distance, Math.floor(distance)); this.score = Math.max(this.score, this.distance + this.coins * 10 + this.shards * 35 + this.kills * 50); }
  addCoin() { this.coins += 1; this.score += 10; }
  addShard() { this.shards += 1; this.score += 35; }
  addKill() { this.kills += 1; this.score += 50; }
}

export function loadNumber(key, fallback = 0) {
  try { const value = Number(globalThis.localStorage?.getItem(key)); return Number.isFinite(value) ? value : fallback; }
  catch { return fallback; }
}
export function saveNumber(key, value) {
  try { globalThis.localStorage?.setItem(key, String(value)); return true; }
  catch { return false; }
}
