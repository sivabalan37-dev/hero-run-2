import * as THREE from 'three';
import { createEnemyState, stepEnemy } from './EnemyAI.js';

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
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = options;
    this.levelNumber = [1, 2, 3, 4, 5, 6].includes(options.levelNumber) ? options.levelNumber : 1;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.platforms = [];
    this.collectibles = [];
    this.enemies = [];
    this.checkpointX = this.levelNumber === 6 ? 38 : this.levelNumber === 5 ? 34 : this.levelNumber === 4 ? 30 : this.levelNumber === 3 ? 26 : this.levelNumber === 2 ? 24 : 22;
    this.exitX = this.levelNumber === 6 ? 54 : this.levelNumber === 5 ? 50 : this.levelNumber === 4 ? 46 : this.levelNumber === 3 ? 44 : this.levelNumber === 2 ? 42 : 40;
    this.buildEnvironment();
    this.buildPlatforms();
    this.buildCollectibles();
    this.buildEnemies();
    this.buildCheckpoint();
    this.buildExit();
  }

  buildEnvironment() {
    const clocktower = this.levelNumber === 6;
    const riverside = this.levelNumber === 5;
    const festival = this.levelNumber === 4;
    const dusk = this.levelNumber === 3;
    const warm = this.levelNumber === 2;
    const sky = new THREE.Color(clocktower ? '#7c8fbd' : riverside ? '#8aaec8' : festival ? '#efa9a0' : dusk ? '#9e9bd8' : warm ? '#f6c98b' : '#8bdcff');
    this.scene.background = sky;
    this.scene.fog = new THREE.Fog(clocktower ? '#aeb4d0' : riverside ? '#b6d3d7' : festival ? '#f4c0a8' : dusk ? '#c6b4e2' : warm ? '#f8dfb4' : '#a6e8ff', 38, 105);
    const hemi = new THREE.HemisphereLight(clocktower ? '#e3e5ff' : riverside ? '#dff7ef' : festival ? '#ffe4cf' : dusk ? '#eadcff' : warm ? '#fff1dd' : '#e8faff', '#52627e', 1.8);
    this.group.add(hemi);
    const sun = new THREE.DirectionalLight(clocktower ? '#d9d0ff' : riverside ? '#ffe0b0' : festival ? '#ffd18b' : dusk ? '#ffc7a4' : warm ? '#ffdda5' : '#fff1cf', 2.6);
    sun.position.set(-12, 22, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -12;
    sun.shadow.normalBias = 0.04;
    this.group.add(sun);

    const sunDisk = mesh(new THREE.SphereGeometry(2.2, 18, 12), glow(dusk ? '#ffb18c' : '#ffe8a1'), -11, 10, -13, this.group, false);
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

    const houseColors = this.levelNumber === 6
      ? ['#7b87aa', '#a4a2c8', '#647da4', '#c1a6bb']
      : this.levelNumber === 5
        ? ['#8ab17d', '#b7a6d8', '#7db6b1', '#e6c27a']
        : this.levelNumber === 4
        ? ['#f7b267', '#e76f7b', '#8ecae6', '#ffc857']
        : this.levelNumber === 2
          ? ['#f1b86f', '#e78b80', '#86b9dc', '#e3a7cd']
          : this.levelNumber === 3
            ? ['#a68acb', '#d68b9a', '#8298c8', '#d6a47d']
            : ['#ffd47a', '#f5a8a0', '#a8d5f5', '#f0c2e7'];
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

    if (this.levelNumber === 6) {
      const stone = standard('#5d6488', 0.72, 0.12);
      const trim = standard('#e3c98a', 0.42, 0.48);
      const tower = new THREE.Group();
      mesh(new THREE.BoxGeometry(7.2, 12, 2.1), stone, 0, 6, 0, tower);
      mesh(new THREE.ConeGeometry(5.1, 3.2, 4), standard('#454d78'), 0, 13.6, 0, tower).rotation.y = Math.PI / 4;
      const face = mesh(new THREE.CylinderGeometry(2.15, 2.15, 0.28, 32), trim, 0, 9.2, 1.12, tower, false);
      face.rotation.x = Math.PI / 2;
      const ring = mesh(new THREE.TorusGeometry(1.92, 0.12, 8, 36), standard('#fff0bd', 0.3, 0.55), 0, 9.2, 1.3, tower, false);
      const handMat = standard('#424564', 0.35, 0.25);
      const hourHand = mesh(new THREE.BoxGeometry(0.13, 0.9, 0.08), handMat, 0, 9.55, 1.48, tower, false);
      hourHand.rotation.z = -0.65;
      const minuteHand = mesh(new THREE.BoxGeometry(0.1, 1.35, 0.08), handMat, 0.28, 9.38, 1.49, tower, false);
      minuteHand.rotation.z = 0.8;
      tower.position.set(35, 0, -8.5);
      this.group.add(tower);
    }

    if (this.levelNumber === 5) {
      const river = mesh(new THREE.BoxGeometry(72, 4.4, 0.35), standard('#4f9eae', 0.24, 0.18), 18, -2.25, -10, this.group, false);
      river.receiveShadow = false;
      const riverEdge = standard('#b4dbd0');
      for (const x of [-10, 1, 12, 23, 34, 45]) {
        mesh(new THREE.BoxGeometry(2.8, 0.18, 0.55), riverEdge, x, -0.18, -7.5, this.group, false);
      }
      const lamp = standard('#536477', 0.4, 0.55);
      const lampGlow = glow('#ffe3a0');
      for (const x of [0, 13, 26, 39, 48]) {
        mesh(new THREE.CylinderGeometry(0.07, 0.11, 4.6, 7), lamp, x, 2.3, -2.4, this.group);
        mesh(new THREE.SphereGeometry(0.28, 10, 8), lampGlow, x, 4.7, -2.4, this.group, false);
      }
    }

    if (this.levelNumber === 4) {
      const poleMat = standard('#76506b');
      const bannerMats = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2'].map(color => standard(color));
      for (let i = 0; i < 6; i++) {
        const x = -1 + i * 8.4;
        mesh(new THREE.CylinderGeometry(0.07, 0.1, 4.3, 7), poleMat, x, 2.15, -2.1, this.group);
        const banner = mesh(new THREE.BoxGeometry(1.25, 0.62, 0.08), bannerMats[i % bannerMats.length],
          x + 0.8, 3.55, -2.1, this.group, false);
        banner.rotation.z = -0.12;
      }
    }
  }

  addPlatform(x, top, width, height = 0.6, solidSides = false) {
    const platform = { x, y: top - height, width, height, solidSides };
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
    this.addPlatform(this.levelNumber === 6 ? 20 : this.levelNumber === 5 ? 18.5 : 16.2, 0, this.levelNumber === 6 ? 78 : this.levelNumber === 5 ? 72 : this.levelNumber === 4 ? 64 : this.levelNumber === 3 ? 60 : 55, 1, true);
    if (this.levelNumber === 6) {
      this.addPlatform(5.5, 1.65, 3.8, 0.5);
      this.addPlatform(12.4, 2.4, 3.8, 0.5);
      this.addPlatform(19.3, 3.1, 3.8, 0.5);
      this.addPlatform(26.5, 2.5, 3.8, 0.5);
      this.addPlatform(33.4, 3.2, 3.8, 0.5);
      this.addPlatform(40.5, 2.55, 3.8, 0.5);
      this.addPlatform(47.2, 2.0, 3.8, 0.5);
    } else if (this.levelNumber === 5) {
      this.addPlatform(5.4, 1.7, 3.7, 0.5);
      this.addPlatform(12.2, 2.35, 3.7, 0.5);
      this.addPlatform(19.4, 1.9, 3.8, 0.5);
      this.addPlatform(26.5, 2.5, 3.8, 0.5);
      this.addPlatform(33.4, 1.85, 4.0, 0.5);
      this.addPlatform(40.2, 2.4, 3.8, 0.5);
      this.addPlatform(46.2, 1.8, 3.5, 0.5);
    } else if (this.levelNumber === 2) {
      this.addPlatform(4.8, 1.55, 3.8, 0.5);
      this.addPlatform(10.4, 2.35, 3.8, 0.5);
      this.addPlatform(17.5, 1.8, 4.0, 0.5);
      this.addPlatform(25.2, 2.25, 4.0, 0.5);
      this.addPlatform(33.5, 1.85, 4.2, 0.5);
    } else if (this.levelNumber === 3) {
      this.addPlatform(6.4, 1.9, 3.6, 0.5);
      this.addPlatform(12.6, 2.75, 3.6, 0.5);
      this.addPlatform(20.2, 2.0, 3.8, 0.5);
      this.addPlatform(27.8, 3.0, 3.8, 0.5);
      this.addPlatform(35.2, 2.25, 4.0, 0.5);
      this.addPlatform(40.5, 1.75, 3.2, 0.5);
    } else if (this.levelNumber === 4) {
      this.addPlatform(5.3, 1.65, 3.8, 0.5);
      this.addPlatform(11.2, 1.9, 3.7, 0.5);
      this.addPlatform(18.1, 1.7, 3.8, 0.5);
      this.addPlatform(24.8, 1.95, 3.8, 0.5);
      this.addPlatform(31.5, 1.7, 3.8, 0.5);
      this.addPlatform(38.2, 1.9, 3.8, 0.5);
      this.addPlatform(43.2, 1.65, 3.2, 0.5);
    } else {
      this.addPlatform(5.5, 1.7, 3.8, 0.5);
      this.addPlatform(11.4, 2.45, 3.6, 0.5);
      this.addPlatform(19.8, 1.65, 3.8, 0.5);
      this.addPlatform(28.2, 1.95, 4.2, 0.5);
    }

    const grass = standard('#75c95c');
    const pathWidth = this.levelNumber === 6 ? 76 : this.levelNumber === 5 ? 70 : this.levelNumber === 4 ? 62 : this.levelNumber === 3 ? 58 : 53;
    const path = mesh(new THREE.BoxGeometry(pathWidth, 0.08, 1.72), grass, this.levelNumber === 6 ? 20 : this.levelNumber === 5 ? 18.5 : 16.2, 0.03, 0, this.group);
    path.receiveShadow = true;
  }

  addCollectible(type, x, y, { hidden = false } = {}) {
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
    group.visible = !hidden;
    this.group.add(group);
    this.collectibles.push({ type, x, y, group, collected: false, hidden });
  }

  buildCollectibles() {
    const route = this.levelNumber === 6
      ? [[1, 1.4], [3.2, 1.4], [5.5, 2.6], [8.8, 1.4], [12.4, 3.1], [16, 1.4], [19.3, 3.8], [22.5, 1.4], [26.5, 3.2], [30, 1.4], [33.4, 3.9], [37, 1.4], [40.5, 3.25], [44, 1.4], [47.2, 2.75], [50, 1.4]]
      : this.levelNumber === 5
        ? [[1, 1.4], [3.1, 1.4], [5.4, 2.65], [8.5, 1.4], [12.2, 3.05], [16, 1.4], [19.4, 2.65], [23, 1.4], [26.5, 3.2], [30, 1.4], [33.4, 2.6], [37, 1.4], [40.2, 3.1], [43.5, 1.4], [46.2, 2.55]]
        : this.levelNumber === 4
        ? [[1, 1.4], [3, 1.4], [5.3, 2.55], [8, 1.4], [11.2, 2.8], [15, 1.4], [18.1, 2.6], [22, 1.4], [24.8, 2.85], [28, 1.4], [31.5, 2.6], [35, 1.4], [38.2, 2.8], [41, 1.4], [43.2, 2.55]]
        : this.levelNumber === 2
        ? [[1, 1.4], [2.2, 1.5], [4.8, 2.65], [7.3, 1.4], [10.4, 3.1], [14.3, 1.4], [17.5, 2.7], [22, 1.4], [25.2, 3.0], [29, 1.4], [33.5, 2.6], [38, 1.4]]
        : this.levelNumber === 3
          ? [[1, 1.4], [3.2, 1.4], [6.4, 2.7], [9.7, 1.4], [12.6, 3.5], [16.5, 1.4], [20.2, 2.8], [24, 1.4], [27.8, 3.75], [31.5, 1.4], [35.2, 3.0], [40.5, 2.6]]
          : [[1, 1.4], [2, 1.5], [3, 1.4], [5.5, 2.8], [11.4, 3.5], [15, 1.45], [20, 2.75], [25, 1.45], [28.2, 3.0], [33, 1.45]];
    for (const [x, y] of route) this.addCollectible('coin', x, y);
    this.addCollectible('heart', this.levelNumber === 6 ? 28 : this.levelNumber === 5 ? 22.5 : this.levelNumber === 4 ? 20.5 : this.levelNumber === 2 ? 13.2 : this.levelNumber === 3 ? 18.4 : 8.8, 1.5);
    this.addCollectible('shard', this.levelNumber === 6 ? 51.2 : this.levelNumber === 5 ? 47.2 : this.levelNumber === 4 ? 42.2 : this.levelNumber === 2 ? 36 : this.levelNumber === 3 ? 40 : 31, 1.8);
    this.addCollectible('coin', this.levelNumber === 6 ? 42.5 : this.levelNumber === 5 ? 37.5 : this.levelNumber === 4 ? 34.5 : this.levelNumber === 2 ? 21.5 : this.levelNumber === 3 ? 29.4 : 9.5, 2.9, { hidden: true });
  }

  buildEnemies() {
    const enemyMat = standard('#6373a6', 0.34, 0.22);
    const enemySpawns = this.levelNumber === 6 ? [10.5, 18.5, 25.8, 33.8, 40.7, 46.8, 50.5] : this.levelNumber === 5 ? [9.8, 17.2, 25.8, 34.8, 41.2, 46.5] : this.levelNumber === 4 ? [10.5, 19.2, 28.3, 36.2, 42.1] : this.levelNumber === 2 ? [13.5, 29.5, 38.5] : this.levelNumber === 3 ? [12.8, 23.7, 33.8, 40.5] : [16.2, 34.2];
    for (const startX of enemySpawns) {
      const group = new THREE.Group();
      mesh(new THREE.SphereGeometry(0.55, 14, 10), enemyMat, 0, 0.62, 0, group);
      const indicator = mesh(new THREE.BoxGeometry(0.72, 0.15, 0.16), glow('#ff766b'), 0, 0.72, 0.44, group, false);
      for (const side of [-1, 1]) {
        const leg = mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.45, 7), enemyMat, side * 0.42, 0.2, 0, group);
        leg.rotation.z = side * -0.35;
      }
      group.position.set(startX, 0, 0.55);
      this.group.add(group);
      const routeHalfWidth = this.levelNumber === 6 ? 1.05 : this.levelNumber === 5 ? 1.1 : this.levelNumber === 4 ? 1.25 : this.levelNumber === 2 ? 1.7 : this.levelNumber === 3 ? 1.35 : 2.3;
      const speed = this.levelNumber === 6 ? 2.35 : this.levelNumber === 5 ? 2.25 : this.levelNumber === 4 ? 2.1 : this.levelNumber === 2 ? 1.7 : this.levelNumber === 3 ? 1.9 : 1.5;
      this.enemies.push({ ...createEnemyState(startX, startX - routeHalfWidth, startX + routeHalfWidth, speed), group, indicator });
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

  revealHidden() {
    let revealed = 0;
    for (const item of this.collectibles) {
      if (!item.hidden || item.collected) continue;
      item.hidden = false;
      item.group.visible = true;
      revealed++;
    }
    return revealed;
  }

  update(dt, heroBody = { x: -100, y: 0 }) {
    for (const enemy of this.enemies) {
      stepEnemy(enemy, heroBody, dt);
      if (!enemy.alive) continue;
      enemy.group.position.x = enemy.x;
      enemy.group.scale.x = enemy.direction;
      enemy.group.position.y = enemy.state === 'attack' ? 0.06 : 0;
      if (enemy.state === 'attack') enemy.indicator.material.color.set('#fff15e');
      else if (enemy.state === 'chase') enemy.indicator.material.color.set('#ffad55');
      else enemy.indicator.material.color.set('#ff766b');
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
