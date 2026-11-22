import * as THREE from 'three';

const mat = (color, roughness = 0.7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const glow = (color, intensity = 1.5) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.32, metalness: 0.25 });

function capsulePart(radius, length, material) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 5, 10), material);
  mesh.castShadow = true;
  return mesh;
}

function boxPart(w, h, d, material, position, parent) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.set(0, 0, 4);
    this.scene.add(this.group);
    this.velocityY = 0;
    this.grounded = true;
    this.airJumps = 0;
    this.maxAirJumps = 1;
    this.health = 100;
    this.coins = 0;
    this.shards = 0;
    this.invulnerable = 0;
    this.attackCooldown = 0;
    this.specialCooldown = 0;
    this.attackAnimTimer = 0;
    this.specialAnimTimer = 0;
    this.slideTimer = 0;
    this.phase = 0;
    this.attackPulse = false;
    this.specialPulse = false;
    this.lane = 1;
    this.targetX = 0;
    this.speed = 8;
    this.shieldTimer = 0;
    this.magnetTimer = 0;
    this.doubleJumpTimer = 0;
    this.speedTimer = 0;
    this.buildModel();
  }

  buildModel() {
    const gold = mat('#ffcb54', 0.32, 0.46);
    const blue = mat('#176bd1', 0.34, 0.2);
    const blueLight = mat('#55baff', 0.3, 0.25);
    const dark = mat('#101e36', 0.42, 0.48);
    const skin = mat('#d99a69', 0.72);
    const white = mat('#f3f8ff', 0.24, 0.18);
    const red = mat('#e95553', 0.38, 0.2);
    const cyan = glow('#39e5ff', 2.2);
    const warmGlow = glow('#ffb64e', 1.5);

    this.model = new THREE.Group();
    this.model.rotation.y = Math.PI;
    this.group.add(this.model);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.92, 0.48), blue);
    torso.position.y = 1.37; torso.castShadow = true; torso.receiveShadow = true; this.model.add(torso);
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.58, 0.12), dark);
    chest.position.set(0, 1.48, 0.275); chest.castShadow = true; this.model.add(chest);
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.61, 0.48, 0.1), blueLight);
    chestPlate.position.set(0, 1.49, 0.345); chestPlate.castShadow = true; this.model.add(chestPlate);
    boxPart(0.62, 0.055, 0.035, gold, [0, 1.75, 0.405], this.model);
    boxPart(0.62, 0.055, 0.035, gold, [0, 1.23, 0.405], this.model);

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 1), cyan);
    core.position.set(0, 1.5, 0.43); core.castShadow = true; this.model.add(core);
    const coreRing = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.028, 8, 24), gold);
    coreRing.position.set(0, 1.5, 0.435); this.model.add(coreRing);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 18), skin);
    head.position.y = 2.12; head.castShadow = true; this.model.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.54), dark);
    hair.position.set(0, 2.23, -0.025); hair.castShadow = true; this.model.add(hair);
    const hairPeak = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.32, 6), dark);
    hairPeak.position.set(0.08, 2.52, -0.015); hairPeak.rotation.z = -0.25; this.model.add(hairPeak);

    // Red cloth cape to match the colourful fantasy hero reference.
    const capeShape = new THREE.Shape();
    capeShape.moveTo(-0.3, 1.95); capeShape.quadraticCurveTo(-0.62, 1.35, -0.78, 0.48);
    capeShape.quadraticCurveTo(0, 0.7, 0.78, 0.48); capeShape.quadraticCurveTo(0.62, 1.35, 0.3, 1.95);
    capeShape.closePath();
    const heroCape = new THREE.Mesh(new THREE.ShapeGeometry(capeShape), new THREE.MeshStandardMaterial({ color: '#e52e3b', roughness: .72, side: THREE.DoubleSide }));
    heroCape.position.set(0, .03, .39); heroCape.rotation.y = Math.PI; heroCape.castShadow = true;
    this.model.add(heroCape);
    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(.12, .28 + (i % 2) * .1, 6), dark);
      spike.position.set((i - 1.5) * .16, 2.43 + (i % 2) * .03, -.08);
      spike.rotation.z = (i - 1.5) * -.18; this.model.add(spike);
    }

    const visorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.15), dark);
    visorFrame.position.set(0, 2.14, 0.31); this.model.add(visorFrame);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.075, 0.055), cyan);
    visor.position.set(0, 2.15, 0.397); this.model.add(visor);
    for (const x of [-0.42, 0.42]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 8), gold);
      ear.position.set(x, 2.1, 0); this.model.add(ear);
      const earGlow = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), cyan);
      earGlow.position.set(x * 1.12, 2.1, 0.03); this.model.add(earGlow);
    }

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.22, 12), dark);
    neck.position.y = 1.91; this.model.add(neck);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.16, 0.54), red);
    belt.position.y = 0.94; this.model.add(belt);
    const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.08), gold);
    beltBuckle.position.set(0, 0.95, 0.3); this.model.add(beltBuckle);
    const hipArmor = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.25, 0.56), dark);
    hipArmor.position.y = 0.78; hipArmor.castShadow = true; this.model.add(hipArmor);

    this.leftArm = new THREE.Group(); this.rightArm = new THREE.Group();
    this.leftArm.position.set(-0.53, 1.77, 0); this.rightArm.position.set(0.53, 1.77, 0);
    this.model.add(this.leftArm, this.rightArm);
    for (const arm of [this.leftArm, this.rightArm]) {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), dark);
      shoulder.position.y = -0.02; shoulder.castShadow = true; arm.add(shoulder);
      const shoulderPlate = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 12), blueLight);
      shoulderPlate.scale.set(1.12, 0.72, 1.08); shoulderPlate.position.set(0, 0.04, 0.045); arm.add(shoulderPlate);
      const upper = capsulePart(0.16, 0.38, blue); upper.position.y = -0.27; arm.add(upper);
      const forearm = capsulePart(0.14, 0.28, dark); forearm.position.y = -0.49; arm.add(forearm);
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.055, 8, 16), gold);
      cuff.rotation.x = Math.PI / 2; cuff.position.y = -0.52; arm.add(cuff);
      const glove = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), red);
      glove.position.y = -0.69; glove.castShadow = true; arm.add(glove);
      const knuckle = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.07, 0.16), gold);
      knuckle.position.set(0, -0.7, 0.12); arm.add(knuckle);
    }

    this.leftLeg = new THREE.Group(); this.rightLeg = new THREE.Group();
    this.leftLeg.position.set(-0.23, 0.83, 0); this.rightLeg.position.set(0.23, 0.83, 0);
    this.model.add(this.leftLeg, this.rightLeg);
    for (const leg of [this.leftLeg, this.rightLeg]) {
      const thigh = capsulePart(0.18, 0.43, dark); thigh.position.y = -0.31; leg.add(thigh);
      const thighPlate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.16), blue);
      thighPlate.position.set(0, -0.22, 0.12); thighPlate.castShadow = true; leg.add(thighPlate);
      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10), gold);
      knee.position.set(0, -0.48, 0.08); leg.add(knee);
      const shin = capsulePart(0.145, 0.28, blue); shin.position.y = -0.56; leg.add(shin);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.52), red);
      boot.position.set(0, -0.72, 0.12); boot.castShadow = true; leg.add(boot);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.065, 0.54), dark);
      sole.position.set(0, -0.83, 0.13); leg.add(sole);
      const bootLight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.035), cyan);
      bootLight.position.set(0, -0.7, 0.39); leg.add(bootLight);
    }

    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.3), dark);
    backpack.position.set(0, 1.35, -0.39); backpack.castShadow = true; this.model.add(backpack);
    for (const x of [-0.2, 0.2]) {
      const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.58, 10), blueLight);
      canister.position.set(x, 1.35, -0.57); canister.castShadow = true; this.model.add(canister);
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.12, 10), warmGlow);
      nozzle.position.set(x, 1.02, -0.57); this.model.add(nozzle);
    }
    const backStripe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.035), cyan);
    backStripe.position.set(0, 1.48, -0.56); this.model.add(backStripe);

    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.72, 28), new THREE.MeshBasicMaterial({ color: '#07101d', transparent: true, opacity: 0.3 }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.025; this.group.add(this.shadow);
    this.groundRing = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.025, 8, 36), new THREE.MeshBasicMaterial({ color: '#35e5ff', transparent: true, opacity: 0.46 }));
    this.groundRing.rotation.x = -Math.PI / 2; this.groundRing.position.y = 0.045; this.group.add(this.groundRing);
    this.shield = new THREE.Mesh(new THREE.SphereGeometry(1.18, 28, 20), new THREE.MeshBasicMaterial({ color: '#62d9ff', wireframe: true, transparent: true, opacity: 0.42 }));
    this.shield.visible = false; this.shield.position.y = 1.25; this.group.add(this.shield);
  }

  update(dt, input, worldSpeed) {
    this.attackPulse = false;
    this.specialPulse = false;
    this.phase += dt * (worldSpeed * 1.1);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.attackAnimTimer = Math.max(0, this.attackAnimTimer - dt);
    this.specialAnimTimer = Math.max(0, this.specialAnimTimer - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.slideTimer = Math.max(0, this.slideTimer - dt);
    this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    this.doubleJumpTimer = Math.max(0, this.doubleJumpTimer - dt);
    this.speedTimer = Math.max(0, this.speedTimer - dt);
    this.shield.visible = this.shieldTimer > 0;
    this.groundRing.material.opacity = this.grounded ? 0.38 : 0.12;
    this.groundRing.rotation.z += dt * 0.7;

    if (input.consume('left')) this.lane = Math.max(0, this.lane - 1);
    if (input.consume('right')) this.lane = Math.min(2, this.lane + 1);
    this.targetX = (this.lane - 1) * 2.6;
    this.group.position.x = THREE.MathUtils.damp(this.group.position.x, this.targetX, 13, dt);

    if (input.consume('jump')) {
      if (this.grounded) {
        this.velocityY = 10.8; this.grounded = false; this.airJumps = 0;
      } else if (this.airJumps < this.maxAirJumps + (this.doubleJumpTimer > 0 ? 1 : 0)) {
        this.velocityY = 9.6; this.airJumps++;
      }
    }
    if (input.consume('slide') && this.grounded) this.slideTimer = 0.62;
    if (input.consume('attack') && this.attackCooldown <= 0) { this.attackPulse = true; this.attackCooldown = 0.32; this.attackAnimTimer = 0.26; this.specialAnimTimer = 0; }
    if (input.consume('special') && this.specialCooldown <= 0) { this.specialPulse = true; this.specialCooldown = 4.2; this.specialAnimTimer = 0.48; this.attackAnimTimer = 0; }

    this.velocityY -= 25 * dt;
    this.group.position.y += this.velocityY * dt;
    if (this.group.position.y <= 0) {
      this.group.position.y = 0; this.velocityY = 0; this.grounded = true; this.airJumps = 0;
    }

    const running = this.grounded && this.slideTimer <= 0;
    const swing = running ? Math.sin(this.phase * 1.3) * 0.72 : 0;
    this.leftLeg.rotation.x = swing;
    this.rightLeg.rotation.x = -swing;
    this.leftArm.rotation.x = -swing * 0.85;
    this.rightArm.rotation.x = swing * 0.85;
    if (!this.grounded) {
      this.leftArm.rotation.x = -1.25; this.rightArm.rotation.x = -1.25;
      this.leftLeg.rotation.x = 0.65; this.rightLeg.rotation.x = -0.65;
    }
    if (this.attackAnimTimer > 0) this.rightArm.rotation.x = -2.05;
    if (this.specialAnimTimer > 0) { this.leftArm.rotation.x = -2.5; this.rightArm.rotation.x = -2.5; }
    this.model.rotation.z = THREE.MathUtils.damp(this.model.rotation.z, this.slideTimer > 0 ? -0.75 : 0, 12, dt);
    this.model.scale.y = THREE.MathUtils.damp(this.model.scale.y, this.slideTimer > 0 ? 0.58 : 1, 15, dt);
    this.model.position.y = running ? Math.abs(Math.sin(this.phase * 2.6)) * 0.055 : 0;
    this.shadow.scale.setScalar(1 - Math.min(0.4, this.group.position.y * 0.1));
    this.groundRing.scale.setScalar(1 - Math.min(0.26, this.group.position.y * 0.07));
    this.model.visible = this.invulnerable <= 0 || Math.floor(this.invulnerable * 18) % 2 === 0;
  }

  damage(amount) {
    if (this.invulnerable > 0) return false;
    if (this.shieldTimer > 0) { this.shieldTimer = 0; this.invulnerable = 0.6; return false; }
    this.health = Math.max(0, this.health - amount);
    this.invulnerable = 1.05;
    return true;
  }

  heal(amount) { this.health = Math.min(100, this.health + amount); }
  activate(type) {
    if (type === 'shield') this.shieldTimer = 7;
    if (type === 'magnet') this.magnetTimer = 9;
    if (type === 'double') this.doubleJumpTimer = 15;
    if (type === 'speed') this.speedTimer = 5;
  }
  destroy() { this.scene.remove(this.group); }
}
