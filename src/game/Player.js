import * as THREE from 'three';

const mat = (color, roughness = 0.7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function capsulePart(radius, length, material) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 8), material);
  mesh.castShadow = true;
  return mesh;
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
    const gold = mat('#ffc84e', 0.45, 0.05);
    const blue = mat('#267fe3', 0.42);
    const dark = mat('#17263f', 0.7);
    const skin = mat('#d99a69', 0.72);
    const white = mat('#f3f7ff', 0.38);
    const red = mat('#ef5b4f', 0.5);
    this.model = new THREE.Group();
    this.model.rotation.y = Math.PI; // Face the forward-running direction (-Z).
    this.group.add(this.model);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.92, 0.48), blue);
    torso.position.y = 1.37; torso.castShadow = true; this.model.add(torso);
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.51), gold);
    chest.position.set(0, 1.44, 0.015); this.model.add(chest);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 14), skin);
    head.position.y = 2.12; head.castShadow = true; this.model.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.37, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), dark);
    hair.position.set(0, 2.22, -0.025); this.model.add(hair);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.13), white);
    visor.position.set(0, 2.13, 0.31); this.model.add(visor);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.13, 0.5), red);
    belt.position.y = 0.94; this.model.add(belt);
    this.leftArm = new THREE.Group(); this.rightArm = new THREE.Group();
    this.leftArm.position.set(-0.53, 1.77, 0); this.rightArm.position.set(0.53, 1.77, 0);
    this.model.add(this.leftArm, this.rightArm);
    for (const arm of [this.leftArm, this.rightArm]) {
      const upper = capsulePart(0.16, 0.38, blue); upper.position.y = -0.27; arm.add(upper);
      const cuff = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), gold); cuff.position.y = -0.55; arm.add(cuff);
    }
    this.leftLeg = new THREE.Group(); this.rightLeg = new THREE.Group();
    this.leftLeg.position.set(-0.23, 0.83, 0); this.rightLeg.position.set(0.23, 0.83, 0);
    this.model.add(this.leftLeg, this.rightLeg);
    for (const leg of [this.leftLeg, this.rightLeg]) {
      const thigh = capsulePart(0.18, 0.43, dark); thigh.position.y = -0.31; leg.add(thigh);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.48), red); boot.position.set(0, -0.63, 0.1); leg.add(boot);
    }
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 20), new THREE.MeshBasicMaterial({ color: '#07101d', transparent: true, opacity: 0.24 }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.025; this.group.add(this.shadow);
    this.shield = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 16), new THREE.MeshBasicMaterial({ color: '#62d9ff', wireframe: true, transparent: true, opacity: 0.45 }));
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
    this.shadow.scale.setScalar(1 - Math.min(0.35, this.group.position.y * 0.1));
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
