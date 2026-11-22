import * as THREE from 'three';
import { createBody } from './PlatformerPhysics.js';

const material = (color, roughness = 0.72) =>
  new THREE.MeshStandardMaterial({ color, roughness });

function addBox(parent, size, position, mat, castShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export class ShinHero {
  constructor(scene, x = -5) {
    this.body = createBody(x, 0);
    this.health = 100;
    this.invulnerable = 0;
    this.attackCooldown = 0;
    this.walkPhase = 0;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.model = new THREE.Group();
    this.group.add(this.model);

    const skin = material('#d9976a');
    const hair = material('#17202d', 0.9);
    const shirt = material('#ef4949', 0.68);
    const shorts = material('#ffcb3f', 0.52);
    const shoe = material('#f5f7f9', 0.4);
    const blue = material('#397dcc', 0.38);
    const dark = material('#243044');

    addBox(this.model, [0.72, 0.66, 0.42], [0, 1.18, 0], shirt);
    addBox(this.model, [0.7, 0.34, 0.43], [0, 0.68, 0], shorts);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), skin);
    head.position.set(0, 1.83, 0.01);
    head.castShadow = true;
    this.model.add(head);
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.355, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), hair);
    hairCap.position.set(0, 1.96, -0.025);
    hairCap.castShadow = true;
    this.model.add(hairCap);
    for (let i = 0; i < 3; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), hair);
      spike.position.set((i - 1) * 0.18, 2.14 + (i % 2) * 0.04, 0);
      spike.rotation.z = (i - 1) * -0.32;
      this.model.add(spike);
    }
    addBox(this.model, [0.055, 0.07, 0.025], [0.13, 1.86, 0.326], dark, false);
    addBox(this.model, [0.055, 0.07, 0.025], [-0.13, 1.86, 0.326], dark, false);

    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.leftLeg.position.set(-0.2, 0.55, 0);
    this.rightLeg.position.set(0.2, 0.55, 0);
    this.model.add(this.leftLeg, this.rightLeg);
    for (const leg of [this.leftLeg, this.rightLeg]) {
      addBox(leg, [0.22, 0.48, 0.24], [0, -0.18, 0], skin);
      addBox(leg, [0.34, 0.18, 0.42], [0, -0.45, 0.08], shoe);
      addBox(leg, [0.22, 0.055, 0.1], [0, -0.39, 0.27], blue, false);
    }
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftArm.position.set(-0.43, 1.43, 0);
    this.rightArm.position.set(0.43, 1.43, 0);
    this.model.add(this.leftArm, this.rightArm);
    for (const arm of [this.leftArm, this.rightArm]) {
      addBox(arm, [0.2, 0.55, 0.22], [0, -0.22, 0], shirt);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), skin);
      hand.position.y = -0.52;
      arm.add(hand);
    }
    this.group.position.set(x, 0, 0);
  }

  reset(x = -5) {
    this.body = createBody(x, 0);
    this.health = 100;
    this.invulnerable = 0;
    this.attackCooldown = 0;
    this.syncVisual(0);
  }

  update(dt, attacking = false) {
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    const moving = Math.abs(this.body.vx) > 0.3 && this.body.grounded;
    this.walkPhase += moving ? dt * 11 : dt * 2;
    const swing = moving ? Math.sin(this.walkPhase) * 0.55 : 0;
    this.leftLeg.rotation.z = swing;
    this.rightLeg.rotation.z = -swing;
    this.leftArm.rotation.z = -swing * 0.55;
    this.rightArm.rotation.z = swing * 0.55 - (attacking ? 0.9 : 0);
    this.model.scale.x = this.body.facing;
    if (this.invulnerable > 0) {
      this.model.visible = Math.floor(this.invulnerable * 14) % 2 === 0;
    } else this.model.visible = true;
    this.syncVisual(dt);
  }

  syncVisual() {
    this.group.position.x = this.body.x;
    this.group.position.y = this.body.y;
  }
}
