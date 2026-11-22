import { Coin } from '../entities/Coin.js';
import { randomInt } from '../utils/helpers.js';
export class CoinManager {
  constructor(scene) { this.scene = scene; this.items = []; this.timer = 0.3; }
  reset() { this.clear(); this.timer = 0.25; }
  spawnLine() {
    const lane = randomInt(0, 2);
    for (let i = 0; i < 5; i += 1) {
      const coin = new Coin(lane, -48 - i * 1.9, 'coin', 1.45 + (i === 2 ? 0.35 : 0));
      this.scene.add(coin.group); this.items.push(coin);
    }
    const roll = Math.random();
    if (roll < 0.22) {
      const shard = new Coin(randomInt(0, 2), -61, 'shard', 1.7);
      this.scene.add(shard.group); this.items.push(shard);
    } else if (roll > 0.86) {
      const heart = new Coin(randomInt(0, 2), -61, 'health', 1.55);
      this.scene.add(heart.group); this.items.push(heart);
    }
  }
  update(dt, speed, time, difficulty) {
    this.timer -= dt;
    if (this.timer <= 0) { this.spawnLine(); this.timer = Math.max(1.5, difficulty.spawnInterval * 1.55); }
    this.items = this.items.filter((item) => {
      item.group.position.z += speed * dt; item.update(dt, time);
      if (item.group.position.z > 10 || item.taken) { item.dispose(); return false; }
      return true;
    });
  }
  remove(item) { item.taken = true; }
  clear() { this.items.forEach((item) => item.dispose()); this.items = []; }
}