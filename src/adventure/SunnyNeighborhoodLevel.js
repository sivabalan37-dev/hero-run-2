import * as THREE from 'three';
import { createEnemyState, stepEnemy } from './EnemyAI.js';
import { initializeBoss, stepBoss } from './BossAI.js';
import { getLevelInfo, WORLDS } from './LevelCatalog.js';
import { getLevelDesign } from './LevelDesigns.js';
import { getEnemyVisualState, getEnemyMotionState, shouldUpdateEnemyVisuals } from './EnemyEffects.js';
import { getGadgetVisionVisualState } from './GadgetVisionEffects.js';
import { getBossAttackVisualState } from './BossEffects.js';
import { getGraphicsPreset } from './GraphicsQuality.js';

const standard = (color, roughness = 0.78, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const glow = (color) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, roughness: 0.28 });

function makeSkyGradientTexture(topColor, horizonColor, lowerColor) {
  const height = 128;
  const pixels = new Uint8Array(height * 4);
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    const color = t < 0.48
      ? lowerColor.clone().lerp(horizonColor, t / 0.48)
      : horizonColor.clone().lerp(topColor, (t - 0.48) / 0.52);
    const hex = color.getHex();
    const offset = y * 4;
    pixels[offset] = (hex >> 16) & 255;
    pixels[offset + 1] = (hex >> 8) & 255;
    pixels[offset + 2] = hex & 255;
    pixels[offset + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, 1, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

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
    this.levelNumber = Number.isInteger(options.levelNumber) && options.levelNumber >= 1 && options.levelNumber <= 40 ? options.levelNumber : 1;
    this.quality = ['low', 'medium', 'high'].includes(options.quality) ? options.quality : 'medium';
    this.info = getLevelInfo(this.levelNumber);
    this.worldIndex = WORLDS.findIndex(world => this.levelNumber >= world.firstLevel && this.levelNumber <= world.lastLevel);
    this.isBossLevel = this.info.isBossLevel;
    this.design = getLevelDesign(this.levelNumber);
    this.group = new THREE.Group();
    scene.add(this.group);
    this.platforms = [];
    this.collectibles = [];
    this.enemies = [];
    this.elapsed = 0;
    this.exitX = this.levelNumber <= 7 ? [0,40,42,44,46,50,54,58][this.levelNumber] : 58 + (this.levelNumber - 7) * 4;
    this.checkpointX = this.levelNumber <= 7 ? [0,22,24,26,30,34,38,42][this.levelNumber] : this.exitX - (this.isBossLevel ? 12 : 16);
    this.buildEnvironment();
    this.buildPlatforms();
    this.buildCollectibles();
    this.buildEnemies();
    this.buildCheckpoint();
    this.buildExit();
    this.buildGadgetVision();
  }

  buildEnvironment() {
    const rooftop = this.levelNumber === 7;
    const clocktower = this.levelNumber === 6;
    const riverside = this.levelNumber === 5;
    const festival = this.levelNumber === 4;
    const dusk = this.levelNumber === 3;
    const warm = this.levelNumber === 2;
    const worldPalettes = [null,
      { sky: '#8bdcff', fog: '#a6e8ff', ground: '#75c95c', enemy: '#6373a6', accent: '#ffd166' },
      { sky: '#9fc8f2', fog: '#c5d9ed', ground: '#68b8a0', enemy: '#557b9c', accent: '#ffe08a' },
      { sky: '#8b9b79', fog: '#b5c49a', ground: '#6f9d52', enemy: '#596b48', accent: '#e9c46a' },
      { sky: '#263b78', fog: '#6174a8', ground: '#4166a8', enemy: '#8d74d6', accent: '#55e6ff' },
      { sky: '#51436f', fog: '#8c79a7', ground: '#7d638d', enemy: '#a56fbc', accent: '#f4d58d' },
    ];
    const worldTheme = worldPalettes[this.worldIndex];
    const sky = new THREE.Color(this.worldIndex === 0 ? (rooftop ? '#e4a56f' : clocktower ? '#7c8fbd' : riverside ? '#8aaec8' : festival ? '#efa9a0' : dusk ? '#9e9bd8' : warm ? '#f6c98b' : '#8bdcff') : worldTheme.sky);
    this.scene.background = sky;
    const fogColor = new THREE.Color(this.worldIndex === 0 ? (rooftop ? '#f2c49a' : clocktower ? '#aeb4d0' : riverside ? '#b6d3d7' : festival ? '#f4c0a8' : dusk ? '#c6b4e2' : warm ? '#f8dfb4' : '#a6e8ff') : worldTheme.fog);
    this.scene.fog = new THREE.Fog(fogColor, 38, 112);

    // A colour-graded sky gives the side-scrolling world a soft horizon instead of a flat blue fill.
    const lowerSky = fogColor.clone().lerp(new THREE.Color('#ffffff'), 0.22);
    const skyBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(100, this.exitX + 76), 82),
      new THREE.MeshBasicMaterial({
        map: makeSkyGradientTexture(sky, fogColor, lowerSky),
        depthWrite: false,
        fog: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    );
    skyBackdrop.position.set(this.exitX / 2, 5, -30);
    skyBackdrop.renderOrder = -10;
    skyBackdrop.frustumCulled = false;
    this.group.add(skyBackdrop);

    const hemi = new THREE.HemisphereLight(rooftop ? '#ffe8c8' : clocktower ? '#e3e5ff' : riverside ? '#dff7ef' : festival ? '#ffe4cf' : dusk ? '#eadcff' : warm ? '#fff1dd' : '#e8faff', '#52627e', 1.8);
    this.group.add(hemi);
    const fill = new THREE.DirectionalLight('#c5e4ff', 0.42);
    fill.position.set(13, 9, -16);
    this.group.add(fill);
    const sun = new THREE.DirectionalLight(rooftop ? '#ffbd83' : clocktower ? '#d9d0ff' : riverside ? '#ffe0b0' : festival ? '#ffd18b' : dusk ? '#ffc7a4' : warm ? '#ffdda5' : '#fff1cf', 2.8);
    sun.position.set(-12, 22, 18);
    sun.castShadow = true;
    const shadowPreset = getGraphicsPreset(this.quality);
    sun.shadow.mapSize.set(shadowPreset.shadowMapSize, shadowPreset.shadowMapSize);
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -12;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 96;
    sun.shadow.bias = -0.00012;
    sun.shadow.normalBias = 0.028;
    sun.shadow.radius = shadowPreset.shadowRadius;
    this.sunLight = sun;
    this.group.add(sun);

    const sunDisk = mesh(new THREE.SphereGeometry(2.2, 18, 12), glow(dusk ? '#ffb18c' : '#ffe8a1'), -11, 10, -13, this.group, false);
    sunDisk.scale.set(1.2, 1, 0.35);

    const cloudMat = standard('#ffffff', 0.96);
    const cloudShade = new THREE.MeshStandardMaterial({ color: '#d7e8f3', roughness: 1, transparent: true, opacity: 0.42, depthWrite: false });
    this.clouds = [];
    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 5; j++) {
        const radius = 0.82 + (j % 3) * 0.17;
        const shade = mesh(new THREE.SphereGeometry(radius, 16, 12), cloudShade,
          j * 0.92, -0.16 + Math.sin(j) * 0.1, -0.08, cloud, false);
        shade.scale.y = 0.48;
        const puff = mesh(new THREE.SphereGeometry(radius, 18, 14), cloudMat,
          j * 0.92, 0.08 + Math.sin(j * 1.2) * 0.16, 0, cloud, false);
        puff.scale.y = 0.64;
      }
      cloud.position.set(-10 + i * ((this.exitX + 24) / 7), 7.5 + (i % 3) * 1.25, -13 - (i % 2) * 2);
      this.group.add(cloud);
      this.clouds.push({ group: cloud, baseX: cloud.position.x, phase: i * 0.8 });
    }

    const houseColors = this.levelNumber === 7
      ? ['#d98c72', '#d6b06f', '#9b9fc8', '#7ca8a1']
      : this.levelNumber === 6
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
      const x = -12 + i * ((this.exitX + 24) / 4);
      const house = new THREE.Group();
      const wallMat = standard(houseColors[i % houseColors.length], 0.88);
      const plasterTrim = standard('#f4e3c7', 0.72);
      const stoneBase = standard('#746e70', 0.92);
      const roofMat = standard(i % 2 ? '#a94e45' : '#b85b4b', 0.72);
      const darkWood = standard('#684431', 0.88);
      const glassMat = new THREE.MeshStandardMaterial({
        color: '#9de8ff', emissive: '#2c7188', emissiveIntensity: 0.22,
        roughness: 0.2, metalness: 0.12,
      });

      mesh(new THREE.BoxGeometry(5.5, 0.34, 2.42), stoneBase, 0, 0.16, 0, house);
      mesh(new THREE.BoxGeometry(5.28, 2.96, 2.28), wallMat, 0, 1.78, 0, house);
      mesh(new THREE.BoxGeometry(5.42, 0.13, 2.38), plasterTrim, 0, 0.43, 0, house);
      mesh(new THREE.BoxGeometry(5.48, 0.12, 2.42), plasterTrim, 0, 3.22, 0, house);
      for (const side of [-1, 1]) {
        mesh(new THREE.BoxGeometry(0.16, 2.75, 0.16), plasterTrim, side * 2.48, 1.82, 1.16, house);
      }

      const roof = mesh(new THREE.ConeGeometry(3.9, 2.1, 4), roofMat, 0, 4.25, 0, house);
      roof.rotation.y = Math.PI / 4;
      mesh(new THREE.BoxGeometry(5.2, 0.16, 2.5), darkWood, 0, 3.27, 0, house);
      mesh(new THREE.BoxGeometry(0.72, 1.75, 0.78), standard('#8b7465'), -1.72, 4.08, -0.15, house);
      mesh(new THREE.BoxGeometry(0.82, 0.12, 0.88), plasterTrim, -1.72, 4.98, -0.15, house);

      // Framed windows with glass, crossbars, shutters and projecting sills.
      for (const wx of [-1.45, 1.45]) {
        mesh(new THREE.BoxGeometry(1.02, 1.02, 0.16), darkWood, wx, 2.0, 1.2, house);
        mesh(new THREE.BoxGeometry(0.78, 0.78, 0.06), glassMat, wx, 2.0, 1.31, house, false);
        mesh(new THREE.BoxGeometry(0.075, 0.82, 0.06), plasterTrim, wx, 2.0, 1.35, house, false);
        mesh(new THREE.BoxGeometry(0.82, 0.075, 0.06), plasterTrim, wx, 2.0, 1.35, house, false);
        mesh(new THREE.BoxGeometry(1.12, 0.13, 0.28), plasterTrim, wx, 1.44, 1.22, house);
        for (const shutterSide of [-1, 1]) {
          mesh(new THREE.BoxGeometry(0.13, 0.88, 0.14), roofMat, wx + shutterSide * 0.58, 2.0, 1.18, house);
        }
      }

      // A recessed front door with a raised panel and brass handle.
      mesh(new THREE.BoxGeometry(1.24, 2.12, 0.18), plasterTrim, 0, 1.22, 1.2, house);
      mesh(new THREE.BoxGeometry(0.94, 1.82, 0.08), darkWood, 0, 1.2, 1.33, house);
      mesh(new THREE.BoxGeometry(0.62, 0.66, 0.045), standard('#82583e'), 0, 1.55, 1.39, house);
      mesh(new THREE.SphereGeometry(0.075, 14, 10), standard('#f4cb69', 0.28, 0.7), 0.32, 1.15, 1.42, house, false);
      mesh(new THREE.BoxGeometry(1.55, 0.16, 0.62), stoneBase, 0, 0.08, 1.45, house);

      house.position.set(x, 0, -6.5);
      this.group.add(house);
    }

    if (this.worldIndex > 0) this.buildWorldLandmarks(worldTheme);

    const treeTrunk = standard(this.worldIndex === 0 ? '#87553b' : worldTheme.accent, 0.92);
    const treeLeaves = [standard('#42a65e', 0.94), standard('#78bd58', 0.94), standard('#2f8f5a', 0.94)];
    for (let i = 0; i < 18; i++) {
      const x = -13 + i * ((this.exitX + 26) / 17);
      mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.55, 12), treeTrunk, x, 0.72, -3.9, this.group);
      for (const [side, height, depth] of [[-1, 1.43, -0.12], [1, 1.48, 0.08]]) {
        const branch = mesh(new THREE.CylinderGeometry(0.055, 0.085, 0.78, 8), treeTrunk,
          x + side * 0.3, height, -3.9 + depth, this.group);
        branch.rotation.z = side * -0.68;
      }
      const crownScale = 0.95 + (i % 3) * 0.12;
      const crown = mesh(new THREE.SphereGeometry(crownScale, 20, 16), treeLeaves[i % 3],
        x, 1.94, -3.9, this.group);
      crown.scale.set(1.08, 0.95, 0.92);
      for (const [side, height, depth] of [[-0.58, 1.76, 0.0], [0.58, 1.78, -0.04], [0, 2.48, -0.03]]) {
        const leaf = mesh(new THREE.SphereGeometry(0.58 + (i % 2) * 0.05, 16, 12),
          treeLeaves[(i + 1) % 3], x + side, height, -3.9 + depth, this.group);
        leaf.scale.set(1.04, 0.95, 0.9);
      }
    }
    this.buildGardenDetails();

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

  buildGardenDetails() {
    if (this.worldIndex !== 0) return;
    const stemMat = standard('#347d45', 0.92);
    const leafMat = standard('#56a84e', 0.9);
    const petalMats = ['#ffda77', '#fff1df', '#ff8e9b', '#bca5ff'].map(color => standard(color, 0.72));
    const flowerCenter = standard('#f4b744', 0.55, 0.08);
    const stoneMat = standard('#9da7a4', 0.98);
    const count = Math.min(36, Math.max(24, Math.ceil(this.exitX * 0.58)));
    for (let i = 0; i < count; i++) {
      const x = -11 + i * ((this.exitX + 22) / Math.max(1, count - 1));
      const plant = new THREE.Group();
      mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.3, 7), stemMat, 0, 0.16, 0, plant, false);
      for (const side of [-1, 1]) {
        const leaf = mesh(new THREE.SphereGeometry(0.12, 10, 8), leafMat,
          side * 0.09, 0.13, 0, plant, false);
        leaf.scale.set(1.35, 0.42, 0.65);
        leaf.rotation.z = side * -0.35;
      }
      const petalMat = petalMats[i % petalMats.length];
      for (let petal = 0; petal < 5; petal++) {
        const angle = petal / 5 * Math.PI * 2;
        const bloom = mesh(new THREE.SphereGeometry(0.075, 9, 7), petalMat,
          Math.cos(angle) * 0.11, 0.34 + Math.sin(angle) * 0.06, Math.sin(angle) * 0.08,
          plant, false);
        bloom.scale.set(1, 0.72, 0.72);
      }
      mesh(new THREE.SphereGeometry(0.065, 10, 8), flowerCenter, 0, 0.34, 0.08, plant, false);
      plant.position.set(x, 0.04, i % 2 === 0 ? 1.02 : -1.02);
      this.group.add(plant);

      if (i % 3 === 0) {
        const stone = mesh(new THREE.DodecahedronGeometry(0.2 + (i % 2) * 0.045, 1),
          stoneMat, x + 0.48, 0.13, i % 2 === 0 ? 1.13 : -1.13, this.group, false);
        stone.scale.set(1.35, 0.62, 0.86);
      }
    }
  }

  applyGraphicsQuality(quality) {
    this.quality = ['low', 'medium', 'high'].includes(quality) ? quality : 'medium';
    if (!this.sunLight) return;
    const preset = getGraphicsPreset(this.quality);
    this.sunLight.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
    this.sunLight.shadow.radius = preset.shadowRadius;
    this.sunLight.shadow.needsUpdate = true;
  }

  buildWorldLandmarks(theme) {
    const materials = [theme.accent, theme.ground, theme.enemy].map(color => standard(color, 0.55, 0.25));
    for (let i = 0; i < 7; i++) {
      const x = -8 + i * ((this.exitX + 20) / 6);
      if (this.worldIndex === 1) {
        const pillar = mesh(new THREE.BoxGeometry(2.2, 5.5 + (i % 3), 1.2), materials[i % 3], x, 2.7, -8, this.group);
        mesh(new THREE.BoxGeometry(2.8, 0.35, 1.5), materials[(i + 1) % 3], x, 5.5 + (i % 3), -8, this.group);
      } else if (this.worldIndex === 2) {
        mesh(new THREE.CylinderGeometry(0.28, 0.5, 5.5, 7), standard('#76533b'), x, 2.75, -8, this.group);
        mesh(new THREE.IcosahedronGeometry(2.2, 1), materials[i % 3], x, 6, -8, this.group);
      } else if (this.worldIndex === 3) {
        mesh(new THREE.BoxGeometry(2.2, 4.5, 1.2), materials[i % 3], x, 2.25, -8, this.group);
        mesh(new THREE.TorusGeometry(1.15, 0.12, 8, 24), materials[(i + 1) % 3], x, 5.2, -8, this.group, false);
      } else {
        mesh(new THREE.ConeGeometry(2.2, 6 + (i % 2), 4), materials[i % 3], x, 3, -8, this.group);
        mesh(new THREE.TorusGeometry(1.4, 0.12, 8, 24), materials[(i + 1) % 3], x, 5.4, -7.2, this.group, false);
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
    this.addPlatform(this.levelNumber >= 8 ? this.exitX / 2 : this.levelNumber === 7 ? 22 : this.levelNumber === 6 ? 20 : this.levelNumber === 5 ? 18.5 : 16.2, 0, this.levelNumber >= 8 ? this.exitX + 14 : this.levelNumber === 7 ? 86 : this.levelNumber === 6 ? 78 : this.levelNumber === 5 ? 72 : this.levelNumber === 4 ? 64 : this.levelNumber === 3 ? 60 : 55, 1, true);
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
    } else if (!this.design) {
      this.addPlatform(5.5, 1.7, 3.8, 0.5);
      this.addPlatform(11.4, 2.45, 3.6, 0.5);
      this.addPlatform(19.8, 1.65, 3.8, 0.5);
      this.addPlatform(28.2, 1.95, 4.2, 0.5);
    }

    if (this.levelNumber === 7) {
      for (const [x, y] of [[5.5,1.7],[12.5,2.5],[19.5,3.2],[26.5,2.4],[33.5,3.15],[40.5,2.5],[47.5,3.2],[54,2.2]]) this.addPlatform(x,y,4,0.5);
      const rooftopMat = standard('#5f647c');
      for (const x of [-2, 12, 27, 42, 55]) mesh(new THREE.BoxGeometry(7.5,0.35,4.8), rooftopMat, x, 3.8, -7.8, this.group);
    } else if (this.design) {
      const authored = this.design.platforms.map(platform => ({
        x: this.exitX * platform.xRatio,
        height: platform.height,
        width: platform.width,
      }));
      for (let i = 0; i < authored.length - 1; i++) {
        const start = authored[i];
        const end = authored[i + 1];
        const segments = Math.max(1, Math.ceil((end.x - start.x) / 6), Math.ceil(Math.abs(end.height - start.height) / 0.5));
        for (let step = 0; step < segments; step++) {
          const t = step / segments;
          this.addPlatform(
            start.x + (end.x - start.x) * t,
            start.height + (end.height - start.height) * t,
            start.width + (end.width - start.width) * t,
            0.5,
          );
        }
      }
      const last = authored[authored.length - 1];
      this.addPlatform(last.x, last.height, last.width, 0.5);
    }
    const grass = standard(this.worldIndex === 0 ? '#75c95c' : ['#75c95c','#68b8a0','#6f9d52','#4166a8','#7d638d'][this.worldIndex]);
    const pathWidth = this.levelNumber >= 8 ? this.exitX + 12 : this.levelNumber === 7 ? 84 : this.levelNumber === 6 ? 76 : this.levelNumber === 5 ? 70 : this.levelNumber === 4 ? 62 : this.levelNumber === 3 ? 58 : 53;
    const path = mesh(new THREE.BoxGeometry(pathWidth, 0.08, 1.72), grass, this.levelNumber >= 8 ? this.exitX / 2 : this.levelNumber === 7 ? 22 : this.levelNumber === 6 ? 20 : this.levelNumber === 5 ? 18.5 : 16.2, 0.03, 0, this.group);
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
    const route = this.levelNumber === 7
      ? [[1,1.4],[3.2,1.4],[5.5,2.7],[9,1.4],[12.5,3.2],[16,1.4],[19.5,3.9],[23,1.4],[26.5,3.1],[30,1.4],[33.5,3.85],[37,1.4],[40.5,3.2],[44,1.4],[47.5,3.9],[51,1.4],[54,2.8]]
      : this.levelNumber === 6
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
    if (this.design) {
      route.length = 0;
      for (let i = 0; i < this.design.coinRatios.length; i++) {
        const ratio = this.design.coinRatios[i];
        const x = this.exitX * ratio;
        const platform = this.design.platforms.reduce((nearest, candidate) =>
          Math.abs(candidate.xRatio - ratio) < Math.abs(nearest.xRatio - ratio) ? candidate : nearest,
          this.design.platforms[0]);
        const platformX = this.exitX * platform.xRatio;
        const coinCanReachPlatform = Math.abs(x - platformX) <= platform.width / 2 + 0.75;
        const y = i % 3 === 1 && coinCanReachPlatform
          ? Math.max(2.45, platform.height + 0.65)
          : 1.4;
        route.push([x, y]);
      }
    }
    for (const [x, y] of route) this.addCollectible('coin', x, y);
    const specialX = this.levelNumber >= 8 ? this.exitX - 9 : this.levelNumber === 7 ? 35 : this.levelNumber === 6 ? 28 : this.levelNumber === 5 ? 22.5 : this.levelNumber === 4 ? 20.5 : this.levelNumber === 2 ? 13.2 : this.levelNumber === 3 ? 18.4 : 8.8;
    const shardX = this.levelNumber >= 8 ? this.exitX - (this.isBossLevel ? 2.4 : 4.8) : this.levelNumber === 7 ? 55.2 : this.levelNumber === 6 ? 51.2 : this.levelNumber === 5 ? 47.2 : this.levelNumber === 4 ? 42.2 : this.levelNumber === 2 ? 36 : this.levelNumber === 3 ? 40 : 31;
    const hiddenX = this.levelNumber >= 8 ? this.exitX - 12 : this.levelNumber === 7 ? 48.5 : this.levelNumber === 6 ? 42.5 : this.levelNumber === 5 ? 37.5 : this.levelNumber === 4 ? 34.5 : this.levelNumber === 2 ? 21.5 : this.levelNumber === 3 ? 29.4 : 9.5;
    this.addCollectible('heart', specialX, 1.5);
    this.addCollectible('shard', shardX, 1.8);
    this.addCollectible('coin', hiddenX, 2.9, { hidden: true });
  }

  buildEnemies() {
    const enemyMat = standard('#6373a6', 0.34, 0.22);
    const worldEnemyTypes = ['robo-bug', 'clockwork-charger', 'vine-sweeper', 'drone-scout', 'time-sentinel'];
    const enemyType = worldEnemyTypes[this.worldIndex] || 'robo-bug';
    const enemySpawns = this.levelNumber === 7 ? [9.5,16.8,23.8,30.8,37.8,44.8,50.5,55] : this.levelNumber === 6 ? [10.5, 18.5, 25.8, 33.8, 40.7, 46.8, 50.5] : this.levelNumber === 5 ? [9.8, 17.2, 25.8, 34.8, 41.2, 46.5] : this.levelNumber === 4 ? [10.5, 19.2, 28.3, 36.2, 42.1] : this.levelNumber === 2 ? [13.5, 29.5, 38.5] : this.levelNumber === 3 ? [12.8, 23.7, 33.8, 40.5] : [16.2, 34.2];
    const activeSpawns = this.design
      ? (this.isBossLevel ? [this.exitX - 5.5] : this.design.enemyRatios.map(ratio => this.exitX * ratio))
      : enemySpawns;
    for (const startX of activeSpawns) {
      const group = new THREE.Group();
      const bossNames = { 8: 'Neighborhood Guardian', 16: 'Mechanical Headmaster', 24: 'Toy Forest Guardian', 32: 'Supreme Machine', 40: 'Ultimate Time Guardian' };
      const isBoss = this.isBossLevel;
      const vineArms = [];
      const droneWings = [];
      let sentinelCore = null;
      let chargerRing = null;
      const bodyMat = isBoss ? standard(this.worldIndex === 0 ? '#d95c56' : this.worldIndex === 1 ? '#5e6f96' : this.worldIndex === 2 ? '#6d9a52' : this.worldIndex === 3 ? '#6c59c4' : '#b58ad5', 0.38, 0.35) : enemyMat;
      mesh(new THREE.SphereGeometry(isBoss ? 1.15 : enemyType === 'drone-scout' ? 0.48 : 0.55, 16, 12), bodyMat, 0, isBoss ? 1.1 : enemyType === 'drone-scout' ? 1.05 : 0.62, 0, group);
      if (isBoss) {
        mesh(new THREE.TorusGeometry(1.05, 0.13, 8, 24), standard(['#ffd166','#ffe08a','#e9c46a','#55e6ff','#f4d58d'][this.worldIndex], 0.3, 0.55), 0, 1.1, 0.12, group, false);
        group.scale.setScalar(1.65);
      } else if (enemyType === 'clockwork-charger') {
        chargerRing = mesh(new THREE.TorusGeometry(0.56, 0.09, 7, 18), standard('#f2bd58', 0.28, 0.65), 0, 0.62, 0.04, group, false);
        for (const side of [-1, 1]) {
          const horn = mesh(new THREE.ConeGeometry(0.13, 0.52, 6), standard('#f7e0a0', 0.3, 0.35), side * 0.34, 1.03, 0.02, group);
          horn.rotation.z = side * -0.7;
        }
      } else if (enemyType === 'vine-sweeper') {
        mesh(new THREE.IcosahedronGeometry(0.32, 1), standard('#a4d16b'), 0, 1.02, 0.05, group);
        for (const side of [-1, 1]) {
          const vine = mesh(new THREE.CylinderGeometry(0.07, 0.11, 1.05, 6), standard('#548b4d'), side * 0.62, 0.62, 0.02, group);
          vine.rotation.z = side * -0.8;
          vineArms.push(vine);
        }
      } else if (enemyType === 'drone-scout') {
        mesh(new THREE.TorusGeometry(0.58, 0.075, 7, 20), standard('#7be9ff', 0.25, 0.62), 0, 1.05, 0, group, false);
        for (const side of [-1, 1]) {
          const wing = mesh(new THREE.BoxGeometry(0.72, 0.13, 0.3), standard('#8bdcf0', 0.3, 0.5), side * 0.67, 1.03, 0, group);
          wing.rotation.z = side * 0.12;
          droneWings.push(wing);
        }
      } else if (enemyType === 'time-sentinel') {
        mesh(new THREE.TorusGeometry(0.62, 0.08, 7, 20), standard('#d7a0ff', 0.24, 0.68), 0, 0.64, 0.02, group, false);
        sentinelCore = mesh(new THREE.OctahedronGeometry(0.2, 0), glow('#f4d6ff'), 0, 1.18, 0.1, group, false);
      }
      const indicator = mesh(new THREE.BoxGeometry(0.72, 0.15, 0.16), glow('#ff766b'), 0, 0.72, 0.44, group, false);
      let bossAttackEffect = null;
      if (isBoss) {
        const attackType = this.info.boss === 'Neighborhood Guardian' ? 'ground-slam'
          : this.info.boss === 'Mechanical Headmaster' ? 'gear-dash'
          : this.info.boss === 'Toy Forest Guardian' ? 'vine-sweep'
          : this.info.boss === 'Supreme Machine' ? 'pulse-blast' : 'time-wave';
        const geometry = attackType === 'ground-slam'
          ? new THREE.RingGeometry(0.58, 0.92, 32)
          : attackType === 'gear-dash'
            ? new THREE.BoxGeometry(2.2, 0.28, 0.12)
            : attackType === 'vine-sweep'
              ? new THREE.TorusGeometry(1.12, 0.12, 8, 28, Math.PI)
              : attackType === 'pulse-blast'
                ? new THREE.SphereGeometry(1.05, 16, 12)
                : new THREE.TorusGeometry(1.45, 0.11, 8, 32);
        const attackMaterial = new THREE.MeshStandardMaterial({
          color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.6,
          transparent: true, opacity: 0, depthWrite: false,
          side: THREE.DoubleSide, wireframe: attackType === 'pulse-blast',
        });
        bossAttackEffect = mesh(geometry, attackMaterial, 0, 0.7, 0.98, group, false);
        bossAttackEffect.visible = false;
        if (attackType === 'ground-slam') bossAttackEffect.position.y = -0.18;
        if (attackType === 'vine-sweep') bossAttackEffect.rotation.z = -0.25;
        if (attackType === 'time-wave') bossAttackEffect.scale.y = 0.38;
      }
      const effectRing = mesh(
        new THREE.TorusGeometry(isBoss ? 1.3 : 0.78, isBoss ? 0.075 : 0.055, 7, 28),
        new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.8, transparent: true, opacity: 0, depthWrite: false }),
        0, 0.12, 0.58, group, false,
      );
      effectRing.visible = false;
      if (!isBoss && enemyType !== 'drone-scout') {
        for (const side of [-1, 1]) {
          const leg = mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.45, 7), enemyMat, side * 0.42, 0.2, 0, group);
          leg.rotation.z = side * -0.35;
        }
      }
      group.position.set(startX, 0, 0.55);
      this.group.add(group);
      const routeHalfWidth = this.levelNumber === 7 ? 0.95 : this.levelNumber === 6 ? 1.05 : this.levelNumber === 5 ? 1.1 : this.levelNumber === 4 ? 1.25 : this.levelNumber === 2 ? 1.7 : this.levelNumber === 3 ? 1.35 : 2.3;
      const speed = this.levelNumber === 7 ? 2.45 : this.levelNumber === 6 ? 2.35 : this.levelNumber === 5 ? 2.25 : this.levelNumber === 4 ? 2.1 : this.levelNumber === 2 ? 1.7 : this.levelNumber === 3 ? 1.9 : 1.5;
      const enemy = createEnemyState(startX, startX - routeHalfWidth, startX + routeHalfWidth, speed, enemyType);
      enemy.isBoss = isBoss;
      if (!isBoss) {
        enemy.health = enemyType === 'time-sentinel' ? 3 : 2;
        enemy.maxHealth = enemy.health;
        enemy.hitRadius = enemyType === 'drone-scout' ? 0.92 : 0.88;
      }
      enemy.bossName = isBoss ? this.info.boss : null;
      enemy.health = isBoss ? 12 : 2;
      enemy.maxHealth = enemy.health;
      enemy.hitRadius = isBoss ? 1.9 : 0.88;
      if (isBoss) initializeBoss(enemy);
      this.enemies.push({ ...enemy, group, indicator, effectRing, bossAttackEffect, vineArms, droneWings, sentinelCore, chargerRing });
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

  buildGadgetVision() {
    this.gadgetScanTimer = 0;
    const scanMaterial = new THREE.MeshStandardMaterial({
      color: '#69f4ff', emissive: '#38dfff', emissiveIntensity: 2.2,
      transparent: true, opacity: 0, depthWrite: false,
    });
    const outerScanMaterial = new THREE.MeshStandardMaterial({
      color: '#b8fbff', emissive: '#69f4ff', emissiveIntensity: 1.5,
      transparent: true, opacity: 0, depthWrite: false,
    });
    this.gadgetScanRing = mesh(
      new THREE.TorusGeometry(0.72, 0.055, 7, 48),
      scanMaterial, 0, 0.12, 1.05, this.group, false,
    );
    this.gadgetScanOuterRing = mesh(
      new THREE.TorusGeometry(0.92, 0.035, 6, 48),
      outerScanMaterial, 0, 0.16, 1.04, this.group, false,
    );
    this.gadgetScanRing.visible = false;
    this.gadgetScanOuterRing.visible = false;
  }

  triggerGadgetVision(x) {
    const revealed = this.revealHidden();
    this.gadgetScanTimer = 1.35;
    this.gadgetScanRing.position.x = x;
    this.gadgetScanRing.visible = true;
    this.gadgetScanOuterRing.visible = true;
    this.gadgetScanRing.scale.setScalar(0.35);
    this.gadgetScanOuterRing.scale.setScalar(0.18);
    return revealed;
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
    this.elapsed += dt;
    for (const cloud of this.clouds ?? []) {
      cloud.group.position.x = cloud.baseX + Math.sin(this.elapsed * 0.12 + cloud.phase) * 0.48;
    }
    if (this.gadgetScanTimer > 0) {
      this.gadgetScanTimer = Math.max(0, this.gadgetScanTimer - dt);
      const progress = 1 - this.gadgetScanTimer / 1.35;
      const scan = getGadgetVisionVisualState(progress);
      const visible = this.gadgetScanTimer > 0;
      this.gadgetScanRing.visible = visible;
      this.gadgetScanOuterRing.visible = visible;
      this.gadgetScanRing.scale.setScalar(scan.innerScale);
      this.gadgetScanOuterRing.scale.setScalar(scan.outerScale);
      this.gadgetScanRing.material.opacity = scan.innerOpacity;
      this.gadgetScanOuterRing.material.opacity = scan.outerOpacity;
    }
    for (const enemy of this.enemies) {
      if (enemy.isBoss) stepBoss(enemy, heroBody, dt);
      else stepEnemy(enemy, heroBody, dt);
      if (!enemy.alive) {
        enemy.effectRing.visible = false;
        if (enemy.bossAttackEffect) enemy.bossAttackEffect.visible = false;
        continue;
      }

      enemy.group.position.x = enemy.x;
      if (!shouldUpdateEnemyVisuals(enemy.x, heroBody.x)) {
        // Keep distant enemy AI and world position current, but skip their off-screen animation work.
        enemy.effectRing.visible = false;
        if (enemy.bossAttackEffect) enemy.bossAttackEffect.visible = false;
        continue;
      }

      const visual = getEnemyVisualState(enemy, this.elapsed + enemy.x * 0.07);
      enemy.group.position.y = visual.bob;
      enemy.group.scale.x = enemy.direction * visual.bodyScaleX;
      enemy.group.scale.y = visual.bodyScaleY;
      enemy.group.rotation.z = visual.rotationZ * enemy.direction;
      if (!enemy.isBoss) {
        const motion = getEnemyMotionState(enemy, this.elapsed + enemy.x * 0.07);
        for (let i = 0; i < enemy.vineArms.length; i++) {
          enemy.vineArms[i].rotation.z = (i === 0 ? -1 : 1) * (0.8 + motion.vineSwing);
        }
        for (let i = 0; i < enemy.droneWings.length; i++) {
          enemy.droneWings[i].rotation.z = (i === 0 ? -1 : 1) * (0.12 + motion.wingFlap);
        }
        if (enemy.sentinelCore) enemy.sentinelCore.rotation.y = motion.coreSpin;
        if (enemy.chargerRing) enemy.chargerRing.rotation.y = motion.chargerSpin;
      }
      enemy.indicator.material.color.set(visual.ringVisible ? visual.ringColor : visual.ringColor);
      enemy.effectRing.visible = visual.ringVisible;
      enemy.effectRing.scale.setScalar(visual.ringScale);
      enemy.effectRing.material.color.set(visual.ringColor);
      enemy.effectRing.material.emissive.set(visual.ringColor);
      enemy.effectRing.material.opacity = visual.ringOpacity;
      if (enemy.isBoss && enemy.bossAttackEffect) {
        const attackVisual = getBossAttackVisualState(enemy, this.elapsed + enemy.x * 0.11);
        const effect = enemy.bossAttackEffect;
        effect.visible = attackVisual.visible;
        effect.position.y = attackVisual.lift + (enemy.attackType === 'ground-slam' ? -0.18 : 0.7);
        effect.scale.set(attackVisual.scaleX, attackVisual.scaleY, 1);
        effect.rotation.z = attackVisual.rotation;
        effect.material.color.set(attackVisual.color);
        effect.material.emissive.set(attackVisual.color);
        effect.material.opacity = attackVisual.opacity;
      }
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
