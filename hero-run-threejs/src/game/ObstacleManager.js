import { Obstacle } from '../entities/Obstacle.js';
import { Enemy } from '../entities/Enemy.js';
import { randomInt } from '../utils/helpers.js';

export class ObstacleManager {
  constructor(scene) { this.scene = scene; this.items = []; this.timer = 0.5; this.count = 0; }
  reset() { this.clear(); this.timer = 0.45; this.count = 0; }
  spawn() {
    const lane = randomInt(0, 2);
    const roll = Math.random();
    let entity;
    if (roll < 0.24 && this.count % 3 === 1) entity = new Enemy(lane, -62);
    else {
      const type = roll < 0.35 ? 'spikes' : roll < 0.58 ? 'log' : roll < 0.82 ? 'crate' : 'rock';
      entity = new Obstacle(lane, -62, type);
    }
    this.scene.add(entity.group);
    this.items.push({ entity, lane, type: entity instanceof Enemy ? 'enemy' : entity.type, hit: false });
    this.count += 1;
  }
  update(dt, speed, elapsed, difficulty) {
    this.timer -= dt;
    if (this.timer <= 0) { this.spawn(); this.timer = difficulty.spawnInterval; }
    this.items = this.items.filter((item) => {
      item.entity.group.position.z += speed * dt;
      item.entity.update?.(dt, elapsed);
      if (item.entity.group.position.z > 11 || item.entity.defeated) {
        item.entity.dispose(); return false;
      }
      return true;
    });
  }
  clear() { this.items.forEach((item) => item.entity.dispose()); this.items = []; }
}