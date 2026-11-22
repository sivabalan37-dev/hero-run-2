import { CONFIG } from '../config/gameConfig.js';
import { clamp } from '../utils/helpers.js';
export class DifficultyManager {
  constructor() { this.reset(); }
  reset() { this.elapsed = 0; this.speed = CONFIG.baseSpeed; }
  update(dt) { this.elapsed += dt; this.speed = clamp(CONFIG.baseSpeed + this.elapsed * CONFIG.acceleration, CONFIG.baseSpeed, CONFIG.maxSpeed); return this.speed; }
  get spawnInterval() { return clamp(2.35 - this.elapsed * 0.008, 1.05, 2.35); }
}