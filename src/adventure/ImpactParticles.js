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
    const available = this.items.filter(item => !item.active);
    const count = Math.min(boss ? 12 : 7, available.length);
    const speed = boss ? 5.1 : 3.8;
    for (let i = 0; i < count; i++) {
      const item = available[i];
      const velocity = getImpactParticleVelocity(i, count, speed);
      item.active = true;
      item.vx = velocity.x;
      item.vy = velocity.y;
      item.life = boss ? 0.48 : 0.34;
      item.maxLife = item.life;
      item.mesh.position.set(x, y, 1.45);
      item.mesh.scale.setScalar(boss ? 1.45 : 1);
      item.mesh.material.color.set(boss ? PARTICLE_COLORS[4] : PARTICLE_COLORS[i % 4]);
      item.mesh.visible = true;
      item.mesh.material.opacity = 1;
    }
    return count;
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
