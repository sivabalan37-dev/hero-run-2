import * as THREE from 'three';

const standard = (color, roughness = 0.72, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const glowing = (color, intensity = 1.5) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.38 });

function roadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#263545'; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 15000; i++) {
    const v = 35 + Math.random() * 55;
    ctx.fillStyle = 'rgba(' + v + ',' + (v + 8) + ',' + (v + 15) + ',' + (Math.random() * 0.2) + ')';
    const s = Math.random() * 2 + 0.4;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, s, s);
  }
  for (let i = 0; i < 32; i++) {
    ctx.strokeStyle = 'rgba(170,205,220,0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const x = Math.random() * 512;
    ctx.moveTo(x, 0); ctx.lineTo(x + (Math.random() - 0.5) * 14, 512);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 48);
  texture.anisotropy = 8;
  return texture;
}

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
    this.clock = 0;
    this.materials = {
      asphalt: standard('#ffffff', 0.92, 0.02),
      trim: glowing('#63d94c', 0.7),
      gold: glowing('#ffc85a', 1.15),
      darkMetal: standard('#26394b', 0.42, 0.58),
      pine: standard('#176b67', 0.86),
      pineLight: standard('#278d80', 0.82),
      wood: standard('#a75c38', 0.78),
      enemy: standard('#b93750', 0.48, 0.16)
    };
    this.makeEnvironment();
    this.makeFloatingKingdom();
    for (let i = 0; i < 8; i++) this.spawnSection();
  }

  makeEnvironment() {
    const ground = new THREE.Mesh(new THREE.BoxGeometry(46, 0.8, 280), standard('#416c45', 1));
    ground.position.set(0, -0.55, -105);
    ground.receiveShadow = true;
    this.group.add(ground);

    const texture = roadTexture();
    this.materials.asphalt.map = texture;
    this.materials.asphalt.needsUpdate = true;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 280), this.materials.asphalt);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.145, -105);
    road.receiveShadow = true;
    this.group.add(road);

    const shoulderMat = standard('#806a43', 0.75, 0.05);
    const curbMat = standard('#7cc84b', 0.65, 0.02);
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.28, 280), shoulderMat);
      shoulder.position.set(side * 5.02, -0.04, -105);
      shoulder.castShadow = true; shoulder.receiveShadow = true; this.group.add(shoulder);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.22, 280), curbMat);
      curb.position.set(side * 4.68, 0.02, -105);
      curb.castShadow = true; this.group.add(curb);
      const glowRail = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, 280), this.materials.trim);
      glowRail.position.set(side * 4.54, 0.16, -105); this.group.add(glowRail);
    }

    const sun = new THREE.Mesh(new THREE.SphereGeometry(5.1, 32, 24), new THREE.MeshBasicMaterial({ color: '#ffe0ae' }));
    sun.position.set(-25, 27, -178); this.group.add(sun);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.16, 8, 72), glowing('#ffb36f', 0.8));
    halo.position.copy(sun.position); halo.rotation.x = 0.28; this.group.add(halo);

    const mountainMat = standard('#496c72', 1);
    const mountainFar = standard('#63868a', 1);
    for (let i = 0; i < 15; i++) {
      const side = i % 2 ? 1 : -1;
      const h = 9 + (i % 5) * 2.8;
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(8 + (i % 3) * 2, h, 5), i % 3 ? mountainMat : mountainFar);
      mountain.position.set(side * (18 + (i % 4) * 7), h * 0.42 - 1, -48 - i * 10);
      mountain.rotation.y = i * 0.73; this.group.add(mountain);
    }

    const buildingMat = standard('#30495b', 0.83, 0.08);
    const windowMat = glowing('#ffbf70', 0.65);
    for (let i = 0; i < 28; i++) {
      const side = i % 2 ? 1 : -1;
      const w = 2.8 + (i % 3) * 1.3;
      const h = 5 + (i % 6) * 1.8;
      const building = new THREE.Group();
      const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3.2), buildingMat);
      tower.position.y = h / 2 - 0.2; tower.castShadow = true; building.add(tower);
      const top = new THREE.Mesh(new THREE.BoxGeometry(w * 0.45, 0.26, 3.35), this.materials.trim);
      top.position.y = h + 0.05; building.add(top);
      for (let row = 0; row < Math.min(5, Math.floor(h / 1.2)); row++) {
        for (let col = 0; col < 2; col++) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.42), windowMat);
          win.position.set((col - 0.5) * w * 0.45, 0.55 + row * 1.05, 1.62);
          building.add(win);
        }
      }
      building.position.set(side * (10 + (i % 4) * 2.2), 0, -25 - i * 6.3);
      this.group.add(building);
    }

    const cloudMat = new THREE.MeshBasicMaterial({ color: '#ffe9d5', transparent: true, opacity: 0.55 });
    for (let i = 0; i < 9; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.4 + (j % 2) * 0.35, 12, 9), cloudMat);
        puff.position.set(j * 1.55, Math.sin(j) * 0.25, 0); puff.scale.y = 0.48; cloud.add(puff);
      }
      cloud.position.set(-25 + i * 6.2, 19 + (i % 3) * 2.4, -75 - i * 10);
      this.group.add(cloud);
    }
  }


  makeFloatingKingdom() {
    const grass = standard('#42b83c', 0.9);
    const grassLight = standard('#79df45', 0.86);
    const soil = standard('#8b5733', 1);
    const stone = standard('#a9b4ae', 0.92);
    const water = new THREE.MeshBasicMaterial({ color: '#55e8ff', transparent: true, opacity: 0.68, side: THREE.DoubleSide });
    const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.86 });
    const addIsland = (x, y, z, scale = 1) => {
      const island = new THREE.Group();
      const top = new THREE.Mesh(new THREE.CylinderGeometry(5.2 * scale, 3.6 * scale, 1.15 * scale, 9), grass);
      top.position.y = 0; top.castShadow = true; top.receiveShadow = true; island.add(top);
      const rock = new THREE.Mesh(new THREE.ConeGeometry(4.3 * scale, 4.8 * scale, 8), soil);
      rock.position.y = -2.65 * scale; rock.rotation.y = 0.25; rock.castShadow = true; island.add(rock);
      for (let i = 0; i < 16; i++) {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(.13 * scale, .42 * scale, 5), i % 2 ? grassLight : grass);
        const a = i / 16 * Math.PI * 2;
        tuft.position.set(Math.cos(a) * 4.5 * scale, .62 * scale, Math.sin(a) * 4.5 * scale);
        island.add(tuft);
      }
      for (let i = 0; i < 3; i++) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.16 * scale, .22 * scale, 1.5 * scale, 7), soil);
        trunk.position.set((i - 1) * 1.1 * scale, 1.25 * scale, -1.4 * scale);
        island.add(trunk);
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(.95 * scale, 1), grassLight);
        crown.position.copy(trunk.position).y += 1.15 * scale; crown.castShadow = true; island.add(crown);
      }
      const fall = new THREE.Mesh(new THREE.PlaneGeometry(2.5 * scale, 8 * scale), water);
      fall.position.set(0, -5.3 * scale, 0); island.add(fall);
      island.position.set(x, y, z); this.group.add(island);
      this.decor.push(island);
      return island;
    };
    addIsland(-15, 5, -38, 1.05);
    addIsland(16, 8, -56, .85);
    addIsland(-24, 10, -83, .72);
    addIsland(25, 6, -104, .9);
    addIsland(-9, 13, -128, .72);

    // Distant fantasy castle silhouette with red roofs, kept low-detail for mobile GPUs.
    const castle = new THREE.Group();
    const wallMat = standard('#e9e2d2', .88);
    const roofMat = standard('#b72e52', .66);
    const keep = new THREE.Mesh(new THREE.BoxGeometry(10, 5.2, 4), wallMat);
    keep.position.y = 2.6; castle.add(keep);
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 2.15;
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(.72, .86, 7, 8), wallMat);
      tower.position.set(x, 4.3, i % 2 ? -1.7 : 1.5); castle.add(tower);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.3, 8), roofMat);
      roof.position.set(x, 8.9, i % 2 ? -1.7 : 1.5); castle.add(roof);
    }
    castle.position.set(0, 2, -151);
    this.group.add(castle); this.decor.push(castle);

    // Bright soft clouds and a blue sky layer behind the running course.
    for (let i = 0; i < 22; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 5; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.25 + (j % 2) * .35, 10, 8), cloudMat);
        puff.position.set(j * 1.35, Math.sin(j * 1.7) * .22, 0);
        puff.scale.y = .58; cloud.add(puff);
      }
      cloud.position.set(-37 + (i % 8) * 10.5, 12 + (i % 4) * 2.6, -35 - Math.floor(i / 8) * 42);
      this.group.add(cloud); this.decor.push(cloud);
    }
  }

  makeTree(x, z, scale = 1, variant = 0) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.5, 7), standard('#80563e', 0.9));
    trunk.position.y = 0.72; trunk.castShadow = true; tree.add(trunk);
    for (let i = 0; i < 3; i++) {
      const crown = new THREE.Mesh(
        new THREE.ConeGeometry((1.05 - i * 0.18) * (variant ? 0.82 : 1), 1.55, 7),
        i === 1 ? this.materials.pineLight : this.materials.pine
      );
      crown.position.y = 1.35 + i * 0.72; crown.castShadow = true; tree.add(crown);
    }
    tree.position.set(x, 0, z); tree.scale.setScalar(scale);
    this.group.add(tree); this.decor.push(tree);
  }

  makeStreetLight(x, z, side) {
    const postMat = standard('#30485b', 0.34, 0.7);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, 5.5, 8), postMat);
    post.position.set(x, 2.75, z); post.castShadow = true; this.group.add(post);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 0.12), postMat);
    arm.position.set(x - side * 0.5, 5.35, z); this.group.add(arm);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), glowing('#ffe0a0', 2.6));
    lamp.position.set(x - side * 0.95, 5.18, z); this.group.add(lamp);
    const light = new THREE.PointLight('#ffd59a', 0.75, 9, 2);
    light.position.copy(lamp.position); this.group.add(light);
    this.decor.push(post, arm, lamp, light);
  }

  createCoin(z, lane, y = 1.25, type = 'coin') {
    const group = new THREE.Group();
    const color = type === 'shard' ? '#55e4ff' : type === 'health' ? '#fa6670' : type === 'coin' ? '#ffce4b' : '#9c8dff';
    const rim = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.35, metalness: 0.72, roughness: 0.22 });
    if (type === 'coin') {
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 24), rim);
      coin.rotation.x = Math.PI / 2; coin.castShadow = true; group.add(coin);
      const face = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 24), standard('#fff2b2', 0.28, 0.6));
      face.position.z = 0.058; group.add(face);
    } else {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.09, 10, 24), rim);
      ring.castShadow = true; group.add(ring);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(type === 'shard' ? 0.26 : 0.21, 1), standard('#fff3bf', 0.22, 0.25));
      core.castShadow = true; group.add(core);
    }
    group.position.set((lane - 1) * 2.6, y, z); this.group.add(group);
    this.collectibles.push({ group, type, taken: false, baseY: y, phase: Math.random() * Math.PI * 2 });
  }

  createObstacle(z, lane, type = 'crate') {
    const group = new THREE.Group();
    if (type === 'enemy') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.76), this.materials.enemy);
      body.position.y = 0.72; body.castShadow = true; group.add(body);
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.34, 0.12), this.materials.gold);
      chest.position.set(0, 0.85, 0.43); group.add(chest);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 14), standard('#d99b73', 0.72));
      head.position.y = 1.58; head.castShadow = true; group.add(head);
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.39, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), this.materials.darkMetal);
      helmet.position.y = 1.7; group.add(helmet);
      const eyeMat = glowing('#ff435d', 2.4);
      for (const x of [-0.14, 0.14]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), eyeMat);
        eye.position.set(x, 1.57, 0.31); group.add(eye);
      }
      for (const x of [-0.56, 0.56]) {
        const pad = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), this.materials.darkMetal);
        pad.position.set(x, 1.22, 0); group.add(pad);
      }
      this.obstacles.push({ group, type, lane, health: 100, attackTime: 0, defeated: false });
    } else {
      if (type === 'spikes') {
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.2, 0.92), this.materials.darkMetal);
        base.position.y = 0.12; base.castShadow = true; group.add(base);
        for (let i = 0; i < 3; i++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.82, 6), standard('#d8e5ec', 0.32, 0.55));
          spike.position.set((i - 1) * 0.34, 0.57, 0); spike.castShadow = true; group.add(spike);
        }
        const warning = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.11), this.materials.gold);
        warning.position.set(0, 0.25, 0.48); group.add(warning);
      } else {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.12, 0.94), this.materials.wood);
        crate.position.y = 0.57; crate.castShadow = true; crate.receiveShadow = true; group.add(crate);
        const frame = this.materials.darkMetal;
        for (const x of [-0.48, 0.48]) {
          const beam = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.18, 1.0), frame);
          beam.position.set(x, 0.57, 0); group.add(beam);
        }
        for (const angle of [-0.7, 0.7]) {
          const brace = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 1.02), this.materials.gold);
          brace.position.y = 0.57; brace.rotation.z = angle; group.add(brace);
        }
        const boltMat = standard('#d2dbe2', 0.24, 0.78);
        for (const x of [-0.42, 0.42]) for (const y of [0.18, 0.96]) {
          const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), boltMat);
          bolt.position.set(x, y, 0.49); group.add(bolt);
        }
      }
      this.obstacles.push({ group, type, lane, health: 1, defeated: false });
    }
    group.position.set((lane - 1) * 2.6, 0, z); this.group.add(group);
  }

  spawnScenery(z, index) {
    for (const side of [-1, 1]) {
      const offset = 7.2 + (index % 3) * 0.6;
      this.makeTree(side * offset, z - 7, 0.78 + (index % 4) * 0.12, index % 2);
      if (index % 2 === 0) this.makeTree(side * (offset + 2.5), z - 14, 0.7, 1);
      if (index % 3 === 0) this.makeStreetLight(side * 5.5, z - 3, side);
    }
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 + (index % 3) * 0.12, 0), standard('#586c70', 1));
    rock.position.set(index % 2 ? 7.5 : -7.5, 0.34, z - 16);
    rock.scale.y = 0.65; rock.castShadow = true; this.group.add(rock); this.decor.push(rock);
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

    const roadSection = new THREE.Group();
    const tile = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.12, 18), this.materials.asphalt);
    tile.position.y = -0.06; tile.receiveShadow = true; roadSection.add(tile);
    for (const x of [-1.3, 1.3]) {
      for (let j = 0; j < 4; j++) {
        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.025, 2.15), this.materials.gold);
        dash.position.set(x, 0.012, -1.4 - j * 4.5); roadSection.add(dash);
      }
    }
    for (const x of [-4.53, 4.53]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.045, 18), this.materials.trim);
      edge.position.set(x, 0.11, 0); roadSection.add(edge);
      for (let j = 0; j < 4; j++) {
        const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.32), this.materials.gold);
        reflector.position.set(x, 0.22, -2 - j * 4.5); roadSection.add(reflector);
      }
    }
    roadSection.position.set(0, 0, z - 9);
    this.group.add(roadSection); this.segments.push(roadSection);
    this.spawnScenery(z, index);
    this.nextZ -= 18;
  }

  update(dt, playerZ, speed) {
    this.clock += dt;
    while (this.nextZ > playerZ - 90) this.spawnSection();
    for (const item of this.collectibles) {
      if (item.taken) continue;
      item.group.rotation.y += dt * 2.6;
      item.group.position.y = item.baseY + Math.sin(this.clock * 2.8 + item.phase) * 0.11;
    }
    for (const enemy of this.obstacles) {
      if (enemy.defeated) continue;
      if (enemy.type === 'enemy') {
        enemy.group.position.y = Math.sin(this.clock * 3 + enemy.group.position.z) * 0.04;
        enemy.group.rotation.y = Math.sin(this.clock * 1.8) * 0.12;
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
    this.segments = this.segments.filter((segment) => {
      if (segment.position.z > cutZ) { this.group.remove(segment); return false; }
      return true;
    });
    this.decor = this.decor.filter((object) => {
      if (object.position.z > cutZ) { this.group.remove(object); return false; }
      return true;
    });
  }

  destroy() {
    this.scene.remove(this.group);
    this.materials.asphalt.map?.dispose();
  }
}
