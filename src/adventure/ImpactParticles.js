import * as THREE from 'three';

const PARTICLE_COUNT = 32;
const PARTICLE_COLORS = ['#fff0a6', '#ffe36e', '#ff9d55', '#9eeaff', '#d7a0ff'];

/** Deterministic radial velocity; avoids random-number work during combat. */
export function getImpactParticleVelocity(index, count = PARTICLE_COUNT, speed = 3.8) {
  const total = Math.max(1, count);
  const angle = (Math.max(0, index) / total) * Math.PI * 2;
  const variation = 0.72 + ((Math.max(0, index) * 7) % 5) * 0.11;
  return { x: Math.cos(angle) * speed * variation, y: Math.sin(angle) * speed * variation };
}

/** Fixed-capacity pooled hit particles. No mesh/material allocation on spawn. */
export class ImpactParticlePool {
  constructor(scene, capacity = PARTICLE_COUNT) {
    this.scene = scene;
    this.nextSpawnIndex = 0;
    this.geometry = new THREE.SphereGeometry(0.075, 6, 5);
    this.materials = Array.from({ length: capacity }, (_, index) => new THREE.MeshBasicMaterial({
      color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
      transparent: true, opacity: 1, depthWrite: false,
    }));
    this.items = Array.from({ length: capacity }, (_, index) => {
      const material = this.materials[index];
      const mesh = new THREE.Mesh(this.geometry, material);
      mesh.visible = false;
      mesh.position.z = 1.45;
      scene.add(mesh);
      return { mesh, active: false, vx: 0, vy: 0, life: 0, maxLife: 0 };
    });
  }

  spawn(x, y, boss = false) {
    const requested = boss ? 12 : 7;
    let availableCount = 0;
    for (const item of this.items) {
      if (!item.active) availableCount++;
    }

    const count = Math.min(requested, availableCount);
    if (count === 0) return 0;

    const speed = boss ? 5.1 : 3.8;
    const life = boss ? 0.48 : 0.34;
    const color = boss ? PARTICLE_COLORS[4] : null;
    let spawned = 0;

    for (let offset = 0; offset < this.items.length && spawned < count; offset++) {
      const index = (this.nextSpawnIndex + offset) % this.items.length;
      const item = this.items[index];
      if (item.active) continue;

      const angle = (spawned / count) * Math.PI * 2;
      const variation = 0.72 + ((spawned * 7) % 5) * 0.11;
      const velocity = speed * variation;
      item.active = true;
      item.vx = Math.cos(angle) * velocity;
      item.vy = Math.sin(angle) * velocity;
      item.life = life;
      item.maxLife = life;
      item.mesh.position.set(x, y, 1.45);
      item.mesh.scale.setScalar(boss ? 1.45 : 1);
      item.mesh.material.color.set(color ?? PARTICLE_COLORS[spawned % 4]);
      item.mesh.visible = true;
      item.mesh.material.opacity = 1;
      spawned++;
      this.nextSpawnIndex = (index + 1) % this.items.length;
    }
    return spawned;
  }

  update(dt) {
    for (const item of this.items) {
      if (!item.active) continue;
      item.life -= dt;
      if (item.life <= 0) {
        item.active = false;
        item.mesh.visible = false;
        continue;
      }
      item.mesh.position.x += item.vx * dt;
      item.mesh.position.y += item.vy * dt;
      item.vy -= 8.5 * dt;
      const progress = item.life / item.maxLife;
      item.mesh.scale.setScalar(0.35 + progress * 0.8);
      item.mesh.material.opacity = progress;
    }
  }

  clear() {
    for (const item of this.items) {
      item.active = false;
      item.mesh.visible = false;
    }
  }

  destroy() {
    this.clear();
    for (const item of this.items) this.scene.remove(item.mesh);
    this.geometry.dispose();
    for (const material of this.materials) material.dispose();
  }
}
