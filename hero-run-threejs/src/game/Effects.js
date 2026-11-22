import * as THREE from 'three';
export class Effects {
  constructor(scene) { this.scene = scene; this.items = []; }
  burst(position, color = '#ffe06c', count = 12) {
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 5), new THREE.MeshBasicMaterial({ color, transparent: true }));
      mesh.position.copy(position);
      const velocity = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8 + 0.2, Math.random() - 0.5).normalize().multiplyScalar(2 + Math.random() * 3);
      this.scene.add(mesh); this.items.push({ mesh, velocity, life: 0.6, max: 0.6 });
    }
  }
  update(dt) {
    this.items = this.items.filter((item) => {
      item.life -= dt; item.mesh.position.addScaledVector(item.velocity, dt); item.velocity.y -= 7 * dt;
      item.mesh.material.opacity = Math.max(0, item.life / item.max);
      if (item.life <= 0) { this.scene.remove(item.mesh); item.mesh.geometry.dispose(); item.mesh.material.dispose(); return false; }
      return true;
    });
  }
  clear() { this.items.forEach((i) => { this.scene.remove(i.mesh); i.mesh.geometry.dispose(); i.mesh.material.dispose(); }); this.items = []; }
}