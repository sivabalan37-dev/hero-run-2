import * as THREE from 'three';

const standard = (color, roughness = 0.72, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

export class World {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.obstacles = [];
    this.collectibles = [];
    this.decor = [];
    this.segments = [];
    this.nextZ = -18;
    this.section = 0;
    this.makeEnvironment();
    for (let i = 0; i < 8; i++) this.spawnSection();
  }

  makeEnvironment() {
    const groundMat = standard('#263d52');
    const roadMat = standard('#334d62');
    const lineMat = standard('#f6c858', 0.35, 0.1);
    const hillMat = standard('#507d78');
    const railMat = standard('#6b8b9b', 0.45, 0.35);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(12, 0.7, 220), groundMat);
    floor.position.set(0, -0.35, -80); floor.receiveShadow = true; this.group.add(floor);
    const road = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.12, 220), roadMat);
    road.position.set(0, -0.06, -80); road.receiveShadow = true; this.group.add(road);
    for (const x of [-1.3, 1.3]) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.018, 220), lineMat);
      line.position.set(x, 0.01, -80); this.group.add(line);
    }
    for (let side = -1; side <= 1; side += 2) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 220), railMat);
      rail.position.set(side * 4.85, 0.03, -80); this.group.add(rail);
      for (let i = 0; i < 30; i++) {
        const h = 3 + (i % 5) * 0.7;
        const hill = new THREE.Mesh(new THREE.ConeGeometry(4 + (i % 3), h, 5), hillMat);
        hill.position.set(side * (10 + (i % 4) * 3), h * 0.45 - 0.5, -i * 9 - 8);
        hill.rotation.y = i * 0.41; this.group.add(hill); this.decor.push(hill);
      }
    }
    const skyGlow = new THREE.Mesh(new THREE.SphereGeometry(2.2, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffe5a0' }));
    skyGlow.position.set(-12, 17, -45); this.group.add(skyGlow); this.decor.push(skyGlow);
  }

  createCoin(z, lane, y = 1.25, type = 'coin') {
    const group = new THREE.Group();
    const color = type === 'shard' ? '#55e4ff' : type === 'health' ? '#fa6670' : type === 'coin' ? '#ffce4b' : '#9c8dff';
    const ring = new THREE.Mesh(new THREE.TorusGeometry(type === 'shard' ? 0.38 : 0.29, 0.09, 8, 18), standard(color, 0.25, 0.45));
    ring.castShadow = true; group.add(ring);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(type === 'shard' ? 0.23 : 0.2, 0), standard('#fff3bf', 0.28, 0.18));
    core.castShadow = true; group.add(core);
    group.position.set((lane - 1) * 2.6, y, z); this.group.add(group);
    this.collectibles.push({ group, type, taken: false, baseY: y, phase: Math.random() * Math.PI * 2 });
  }

  createObstacle(z, lane, type = 'crate') {
    const group = new THREE.Group();
    if (type === 'enemy') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.25, 0.78), standard('#c84d4b'));
      body.position.y = 0.65; body.castShadow = true; group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), standard('#efb36b'));
      head.position.y = 1.48; head.castShadow = true; group.add(head);
      const eyeMat = new THREE.MeshBasicMaterial({ color: '#1d1724' });
      for (const x of [-0.12, 0.12]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), eyeMat); eye.position.set(x, 1.5, 0.28); group.add(eye); }
      this.obstacles.push({ group, type, lane, health: 100, attackTime: 0, defeated: false });
    } else {
      const color = type === 'spikes' ? '#d9e7ef' : '#cf7846';
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.05, type === 'spikes' ? 0.75 : 1.15, 0.9), standard(color, 0.62, 0.05));
      box.position.y = type === 'spikes' ? 0.38 : 0.58; box.castShadow = true; group.add(box);
      if (type === 'crate') {
        const crossMat = standard('#f6c779', 0.5);
        for (const rot of [0, Math.PI / 2]) { const cross = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 1), crossMat); cross.rotation.y = rot; cross.position.y = 0.58; group.add(cross); }
      }
      this.obstacles.push({ group, type, lane, health: 1, defeated: false });
    }
    group.position.set((lane - 1) * 2.6, 0, z); this.group.add(group);
  }

  spawnSection() {
    const z = this.nextZ;
    const index = this.section++;
    const lane = (index * 7 + 1) % 3;
    if (index % 5 === 2) {
      this.createObstacle(z - 5, lane, 'enemy');
      this.createCoin(z - 8, lane === 2 ? 1 : lane + 1, 1.25, 'coin');
      this.createCoin(z - 11, lane, 1.4, 'shard');
    } else if (index % 5 === 4) {
      this.createObstacle(z - 5, lane, 'spikes');
      this.createCoin(z - 8, (lane + 1) % 3, 2.0, 'health');
    } else {
      this.createObstacle(z - 5, lane, 'crate');
      for (let i = 0; i < 4; i++) this.createCoin(z - 8 - i * 1.65, (lane + 1) % 3, 1.25 + Math.sin(i / 3 * Math.PI) * 0.7, i === 2 && index % 3 === 0 ? 'shard' : 'coin');
    }
    if (index % 7 === 3) this.createCoin(z - 13, (lane + 2) % 3, 1.1, ['shield', 'magnet', 'speed', 'double'][(index / 7 | 0) % 4]);
    const roadSegment = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.12, 18), standard('#334d62'));
    roadSegment.position.set(0, -0.06, z - 9); roadSegment.receiveShadow = true; this.group.add(roadSegment); this.segments.push(roadSegment);
    for (const x of [-1.3, 1.3]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.018, 17.8), standard('#f6c858', 0.35, 0.1));
      stripe.position.set(x, 0.01, z - 9); this.group.add(stripe); this.segments.push(stripe);
    }
    const mark = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.02, 17), standard(index % 2 ? '#354e61' : '#3a5365'));
    mark.position.set(0, -0.005, z - 8.5); this.group.add(mark); this.segments.push(mark);
    this.nextZ -= 18;
  }

  update(dt, playerZ, speed) {
    while (this.nextZ > playerZ - 90) this.spawnSection();
    for (const item of this.collectibles) {
      if (item.taken) continue;
      item.group.rotation.y += dt * 2.6;
      item.group.position.y = item.baseY + Math.sin(performance.now() * 0.002 + item.phase) * 0.11;
    }
    for (const enemy of this.obstacles) {
      if (enemy.defeated) continue;
      if (enemy.type === 'enemy') {
        enemy.group.position.y = Math.sin(performance.now() * 0.003 + enemy.group.position.z) * 0.04;
        enemy.group.rotation.y = Math.sin(performance.now() * 0.002) * 0.12;
      }
    }
    const cutZ = playerZ + 28;
    this.collectibles = this.collectibles.filter((item) => {
      if (item.taken || item.group.position.z > cutZ) { this.group.remove(item.group); return false; }
      return true;
    });
    this.obstacles = this.obstacles.filter((item) => {
      if (item.defeated || item.group.position.z > cutZ) { this.group.remove(item.group); return false; }
      return true;
    });
    this.segments = this.segments.filter((s) => {
      if (s.position.z > cutZ) { this.group.remove(s); return false; }
      return true;
    });
  }

  destroy() { this.scene.remove(this.group); }
}
