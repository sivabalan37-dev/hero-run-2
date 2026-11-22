import * as THREE from 'three';

const MAX_PROJECTILES = 12;
function createStarGeometry() {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? 0.42 : 0.19;
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

/** Fixed-capacity projectile pool; firing never creates new geometry or meshes. */
export class ToyStarPool {
  constructor(scene) {
    this.scene = scene;
    this.geometry = createStarGeometry();
    this.material = new THREE.MeshStandardMaterial({
      color: '#ffe36e',
      emissive: '#ff9d32',
      emissiveIntensity: 1.25,
      metalness: 0.45,
      roughness: 0.25,
      side: THREE.DoubleSide,
    });
    this.items = Array.from({ length: MAX_PROJECTILES }, () => {
      const mesh = new THREE.Mesh(this.geometry, this.material);
      mesh.visible = false;
      mesh.position.z = 1.05;
      mesh.castShadow = false;
      scene.add(mesh);
      return { mesh, active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, damage: 1 };
    });
  }

  spawn(x, y, vx, vy = 0, life = 1.45) {
    const item = this.items.find(candidate => !candidate.active);
    if (!item) return false;
    item.active = true;
    item.x = x;
    item.y = y;
    item.vx = vx;
    item.vy = vy;
    item.life = life;
    item.mesh.position.set(x, y, 1.05);
    item.mesh.rotation.z = 0;
    item.mesh.visible = true;
    return true;
  }

  fireToyStar(x, y, facing) {
    return this.spawn(x + facing * 0.7, y, facing * 14.5, 0, 1.55);
  }

  fireStarBurst(x, y, facing) {
    let fired = 0;
    const spread = [-0.62, -0.4, -0.2, 0, 0.2, 0.4, 0.62];
    for (const angle of spread) {
      const vx = Math.cos(angle) * facing * 12.2;
      const vy = Math.sin(angle) * 12.2;
      if (this.spawn(x + facing * 0.55, y, vx, vy, 0.92)) fired++;
    }
    return fired;
  }

  update(dt, enemies) {
    let hits = 0;
    let defeated = 0;
    for (const item of this.items) {
      if (!item.active) continue;
      item.life -= dt;
      if (item.life <= 0) {
        this.deactivate(item);
        continue;
      }

      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.mesh.position.x = item.x;
      item.mesh.position.y = item.y;
      item.mesh.rotation.z += dt * 9;

      for (const enemy of enemies) {
        if (!enemy.alive || enemy.hurtTimer > 0) continue;
        const dx = item.x - enemy.x;
        const dy = item.y - 0.62;
        if (dx * dx + dy * dy > 0.88 * 0.88) continue;
        enemy.health = Math.max(0, enemy.health - item.damage);
        enemy.hurtTimer = 0.16;
        hits++;
        if (enemy.health <= 0) {
          enemy.alive = false;
          enemy.state = 'dead';
          enemy.group.visible = false;
          defeated++;
        }
        this.deactivate(item);
        break;
      }
    }
    return { hits, defeated };
  }

  deactivate(item) {
    item.active = false;
    item.life = 0;
    item.mesh.visible = false;
  }

  clear() {
    for (const item of this.items) this.deactivate(item);
  }

  destroy() {
    this.clear();
    for (const item of this.items) {
      this.scene.remove(item.mesh);
    }
    this.geometry.dispose();
    this.material.dispose();
  }
}
