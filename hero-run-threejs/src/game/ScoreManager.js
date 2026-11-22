import { CONFIG } from '../config/gameConfig.js';
export class ScoreManager {
  reset() { this.score = 0; this.distance = 0; this.coins = 0; this.shards = 0; this.kills = 0; }
  constructor() { this.reset(); }
  updateDistance(amount) { this.distance += Math.max(0, amount); this.recalculate(); }
  addCoin() { this.coins += 1; this.score += CONFIG.coinValue; }
  addShard() { this.shards += 1; this.score += CONFIG.shardValue; }
  addKill() { this.kills += 1; this.score += CONFIG.enemyValue; }
  recalculate() { this.score = Math.floor(this.distance) + this.coins * CONFIG.coinValue + this.shards * CONFIG.shardValue + this.kills * CONFIG.enemyValue; }
}