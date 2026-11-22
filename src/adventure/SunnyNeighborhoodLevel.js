import * as THREE from 'three';

const standard = (color, roughness = 0.78, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const glow = (color) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, roughness: 0.28 });

function mesh(geometry, material, x, y, z, parent, castShadow = true) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = castShadow;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

export class SunnyNeighborhoodLevel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.platforms = [];
    this.collectibles = [];
    this.enemies = [];
    this.checkpointX = 22;
    this.exitX = 40;
    this.buildEnvironment();
    this.buildPlatforms();
    this.buildCollectibles();
    this.buildEnemies();
    this.buildCheckpoint();
    this.buildExit();
  }

  buildEnvironment() {
    const sky = new THREE.Color('#8bdcff');
    this.scene.background = sky;
    this.scene.fog = new THREE.Fog('#a6e8ff', 38, 105);
    const hemi = new THREE.HemisphereLight('#e8faff', '#66834c', 1.8);
    this.group.add(hemi);
    const sun = new THREE.DirectionalLight('#fff1cf', 2.6);
    sun.position.set(-12, 22, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -12;
    sun.shadow.normalBias = 0.04;
    this.group.add(sun);

    const sunDisk = mesh(new THREE.SphereGeometry(2.2, 18, 12), glow('#ffe8a1'), -11, 10, -13, this.group, false);
    sunDisk.scale.set(1.2, 1, 0.35);

    const cloudMat = standard('#ffffff');
    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 3; j++) {
        const puff = mesh(new THREE.SphereGeometry(0.8 + (j % 2) * 0.15, 10, 8), cloudMat,
          j * 1.05, Math.sin(j) * 0.14, 0, cloud, false);
        puff.scale.y = 0.62;
      }
      cloud.position.set(-10 + i * 7.8, 7.5 + (i % 3) * 1.25, -9);
      this.group.add(cloud);
    }

    const houseColors = ['#ffd47a', '#f5a8a0', '#a8d5f5', '#f0c2e7'];
    for (let i = 0; i < 5; i++) {
      const x = -12 + i * 12.5;
      const house = new THREE.Group();
      const wallMat = standard(houseColors[i % houseColors.length]);
      mesh(new THREE.BoxGeometry(5.2, 3.2, 2.2), wallMat, 0, 1.6, 0, house);
      const roof = mesh(new THREE.ConeGeometry(3.9, 2.1, 4), standard('#b85b4b'), 0, 4.25, 0, house);
      roof.rotation.y = Math.PI / 4;
      mesh(new THREE.BoxGeometry(0.95, 1.8, 0.12), standard('#76513c'), 0, 0.9, 1.16, house);
      for (const wx of [-1.45, 1.45]) {
        mesh(new THREE.BoxGeometry(0.72, 0.75, 0.13), standard('#8de1f4'), wx, 1.95, 1.16, house, false);
      }
      house.position.set(x, 0, -6.5);
      this.group.add(house);
    }

    const treeTrunk = standard('#87553b');
    const treeLeaves = [standard('#42a65e'), standard('#78bd58'), standard('#2f8f5a')];
    for (let i = 0; i < 18; i++) {
      const x = -13 + i * 3.1;
      mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.4, 7), treeTrunk, x, 0.65, -3.9, this.group);
      mesh(new THREE.IcosahedronGeometry(0.95 + (i % 3) * 0.12, 1), treeLeaves[i % 3],
        x, 1.85, -3.9, this.group);
    }
  }

  addPlatform(x, top, width, height = 0.6) {
    const platform = { x, y: top - height, width, height };
    this.platforms.push(platform);
    const topMat = standard('#61bd62');
    const sideMat = standard('#96613d');
    const block = new THREE.Group();
    mesh(new THREE.BoxGeometry(width, height, 1.6), sideMat, 0, height / 2, 0, block);
    mesh(new THREE.BoxGeometry(width + 0.1, 0.16, 1.72), topMat, 0, height - 0.08, 0, block);
    block.position.set(x, platform.y, 0);
    this.group.add(block);
    return platform;
  }

  buildPlatforms() {
    // A continuous safe route makes the first level completable while optional raised routes teach jumping.
    this.addPlatform(16.2, 0, 53, 1);
    this.addPlatform(5.5, 1.7, 3.8, 0.5);
    this.addPlatform(11.4, 2.45, 3.6, 0.5);
    this.addPlatform(19.8, 1.65, 3.8, 0.5);
    this.addPlatform(28.2, 1.95, 4.2, 0.5);

    const grass = standard('#75c95c');
    const path = mesh(new THREE.BoxGeometry(53, 0.08, 1.72), grass, 16.2, 0.03, 0, this.group);
    path.receiveShadow = true;
  }

  addCollectible(type, x, y) {
    const group = new THREE.Group();
    const color = type === 'coin' ? '#ffd44f' : type === 'heart' ? '#ff647b' : '#61eaff';
    const material = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 1.25, metalness: 0.55, roughness: 0.24
    });
    if (type === 'coin') {
      const disk = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.11, 20), material, 0, 0, 0, group);
      disk.rotation.z = Math.PI / 2;
      mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 20), standard('#fff0ab'), 0, 0, 0.08, group, false);
    } else {
      mesh(new THREE.OctahedronGeometry(type === 'shard' ? 0.43 : 0.35, 1), material, 0, 0, 0, group);
      if (type === 'heart') {
        const dot = mesh(new THREE.SphereGeometry(0.13, 10, 8), standard('#fff0f0'), 0, 0.02, 0.28, group, false);
        dot.scale.set(0.75, 0.75, 0.5);
      }
    }
    group.position.set(x, y, 0.45);
    this.group.add(group);
    this.collectibles.push({ type, x, y, group, collected: false });
  }

  buildCollectibles() {
    for (const [x, y] of [[1, 1.4], [2, 1.5], [3, 1.4], [5.5, 2.8], [11.4, 3.5], [15, 1.45], [20, 2.75], [25, 1.45], [28.2, 3.0], [33, 1.45]]) {
      this.addCollectible('coin', x, y);
    }
    this.addCollectible('heart', 8.8, 1.5);
    this.addCollectible('shard', 31, 1.8);
  }

  buildEnemies() {
    const enemyMat = standard('#6373a6', 0.34, 0.22);
    const glowMat = glow('#ff766b');
    for (const startX of [16.2, 34.2]) {
      const group = new THREE.Group();
      mesh(new THREE.SphereGeometry(0.55, 14, 10), enemyMat, 0, 0.62, 0, group);
      mesh(new THREE.BoxGeometry(0.72, 0.15, 0.16), glowMat, 0, 0.72, 0.44, group, false);
      for (const side of [-1, 1]) {
        const leg = mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.45, 7), enemyMat, side * 0.42, 0.2, 0, group);
        leg.rotation.z = side * -0.35;
      }
      group.position.set(startX, 0, 0.55);
      this.group.add(group);
      this.enemies.push({ group, x: startX, minX: startX - 2.3, maxX: startX + 2.3, direction: 1, speed: 1.5, alive: true });
    }
  }

  buildCheckpoint() {
    this.checkpoint = new THREE.Group();
    const pole = standard('#f4f2e9');
    mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.8, 8), pole, 0, 1.4, 0, this.checkpoint);
    mesh(new THREE.BoxGeometry(0.9, 0.52, 0.08), glow('#47e9c1'), 0.48, 2.35, 0, this.checkpoint);
    this.checkpoint.position.set(this.checkpointX, 0, 0.7);
    this.group.add(this.checkpoint);
    this.checkpointActivated = false;
  }

  buildExit() {
    this.exit = new THREE.Group();
    const frame = standard('#34476a', 0.35, 0.5);
    const portal = glow('#7d78ff');
    for (const x of [-0.9, 0.9]) {
      mesh(new THREE.BoxGeometry(0.22, 4.1, 0.45), frame, x, 2.05, 0, this.exit);
    }
    mesh(new THREE.BoxGeometry(2, 0.24, 0.48), frame, 0, 4.05, 0, this.exit);
    mesh(new THREE.PlaneGeometry(1.55, 3.45), portal, 0, 1.9, -0.05, this.exit, false);
    this.exit.position.set(this.exitX, 0, 0.8);
    this.group.add(this.exit);
  }

  update(dt) {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.x += enemy.direction * enemy.speed * dt;
      if (enemy.x > enemy.maxX) { enemy.x = enemy.maxX; enemy.direction = -1; }
      if (enemy.x < enemy.minX) { enemy.x = enemy.minX; enemy.direction = 1; }
      enemy.group.position.x = enemy.x;
    }
  }

  destroy() {
    this.scene.remove(this.group);
    this.group.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
        else object.material.dispose();
      }
    });
  }
}
