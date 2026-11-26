import { PowerUp } from '../entities/PowerUp.js';
import { randomInt } from '../utils/helpers.js';
export class PowerUpManager {
  constructor(scene) { this.scene = scene; this.items = []; this.timer = 12; }
  reset() { this.clear(); this.timer = 11; }
  update(dt, speed, time) {
    this.timer -= dt;
    if (this.timer <= 0) {
      const type = ['shield','magnet','boost'][randomInt(0,2)];
      const item = new PowerUp(type, randomInt(0,2), -62);
      this.scene.add(item.group); this.items.push(item); this.timer = 16 + Math.random() * 7;
    }
    this.items = this.items.filter((item) => {
      item.group.position.z += speed * dt; item.update(dt, time);
      if (item.group.position.z > 10 || item.taken) { item.dispose(); return false; }
      return true;
    });
  }
  clear() { this.items.forEach((item) => item.dispose()); this.items = []; }
}