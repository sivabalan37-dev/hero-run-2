import * as THREE from 'three';

export class Effects {
  constructor(scene) { this.scene = scene; this.items = []; }
  burst(position, color = '#ffd35a', count = 12) {
    const material = new THREE.MeshBasicMaterial({ color, transparent: true });
    const geometry = new THREE.SphereGeometry(0.055, 5, 4);
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, material.clone());
      mesh.position.copy(position);
      const direction = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8 + 0.15, Math.random() - 0.5).normalize();
      this.scene.add(mesh);
      this.items.push({ mesh, velocity: direction.multiplyScalar(2 + Math.random() * 3), life: 0.55 + Math.random() * 0.3, maxLife: 0.85 });
    }
  }
  destroy() {
    for (const item of this.items) { this.scene.remove(item.mesh); item.mesh.geometry.dispose(); item.mesh.material.dispose(); }
    this.items = [];
  }
  update(dt) {
    this.items = this.items.filter((item) => {
      item.life -= dt;
      item.mesh.position.addScaledVector(item.velocity, dt);
      item.velocity.y -= 8 * dt;
      item.mesh.material.opacity = Math.max(0, item.life / item.maxLife);
      if (item.life <= 0) { this.scene.remove(item.mesh); item.mesh.geometry.dispose(); item.mesh.material.dispose(); return false; }
      return true;
    });
  }
}
