import { damp } from '../utils/helpers.js';
export class CameraController {
  constructor(camera) { this.camera = camera; }
  update(dt, player) {
    this.camera.position.x = damp(this.camera.position.x, player.group.position.x * 0.22, 3.8, dt);
    this.camera.position.y = damp(this.camera.position.y, 7.1 + player.group.position.y * 0.11, 3, dt);
    this.camera.lookAt(player.group.position.x * 0.15, 1.7 + player.group.position.y * 0.12, -16);
  }
}