import * as THREE from 'three';
import { createBody } from './PlatformerPhysics.js';
import { getAttackPose } from './HeroAnimation.js';
import { getBenjiSpecialVisualState } from './BenjiSpecialEffects.js';

const material = (color, roughness = 0.72, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function addBox(parent, size, position, mat, castShadow = true) {
  const object = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  object.position.set(...position);
  object.castShadow = castShadow;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function addSphere(parent, radius, position, mat, segments = 16) {
  const object = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, Math.max(8, Math.floor(segments * 0.7))), mat);
  object.position.set(...position);
  object.castShadow = true;
  parent.add(object);
  return object;
}

class BaseHero {
  constructor(scene, x = -5) {
    this.scene = scene;
    this.maxAirJumps = 0;
    this.body = createBody(x, 0);
    this.body.maxAirJumps = this.maxAirJumps;
    this.body.airJumpsRemaining = this.maxAirJumps;
    this.health = 100;
    this.invulnerable = 0;
    this.attackCooldown = 0;
    this.walkPhase = 0;
    this.attackBlend = 0;
    this.visualScale = 1;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.model = new THREE.Group();
    this.group.add(this.model);
    this.buildModel();
    this.syncVisual();
  }

  reset(x = -5) {
    this.body = createBody(x, 0);
    this.body.maxAirJumps = this.maxAirJumps;
    this.body.airJumpsRemaining = this.maxAirJumps;
    this.health = 100;
    this.invulnerable = 0;
    this.attackCooldown = 0;
    this.walkPhase = 0;
    this.attackBlend = 0;
    this.syncVisual();
  }

  update(dt, attacking = false, aerialState = {}) {
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    const moving = Math.abs(this.body.vx) > 0.3 && this.body.grounded;
    this.walkPhase += moving ? dt * 11 : dt * 2;
    const swing = moving ? Math.sin(this.walkPhase) * 0.55 : 0;
    this.attackBlend = attacking ? Math.min(1, this.attackBlend + dt * 14) : Math.max(0, this.attackBlend - dt * 9);
    const attackPose = getAttackPose(this.attackBlend);
    if (this.leftLeg) this.leftLeg.rotation.z = swing;
    if (this.rightLeg) this.rightLeg.rotation.z = -swing;
    if (this.leftArm) this.leftArm.rotation.z = -swing * 0.55 + attackPose.leftArmRotation;
    if (this.rightArm) this.rightArm.rotation.z = swing * 0.55 + attackPose.rightArmRotation;
    this.model.rotation.z = -attackPose.bodyLean;
    if (this.rotor) {
      this.rotor.rotation.y += dt * (aerialState.dashing ? 30 : moving ? 15 : 5);
      this.rotor.rotation.x += ((aerialState.gliding ? 0.32 : 0) - this.rotor.rotation.x) * Math.min(1, dt * 8);
      this.rotor.scale.setScalar(aerialState.gliding ? 1.12 : 1);
    }
    if (aerialState.dashing) this.model.rotation.z -= 0.16;
    else if (aerialState.gliding) this.model.rotation.z -= 0.055;
    this.model.scale.set(this.body.facing * this.visualScale, this.visualScale, this.visualScale);
    this.model.visible = this.invulnerable <= 0 || Math.floor(this.invulnerable * 14) % 2 === 0;
    this.syncVisual();
  }

  syncVisual() {
    this.group.position.x = this.body.x;
    this.group.position.y = this.body.y;
  }

  destroy() {
    this.scene.remove(this.group);
    this.group.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach(item => item.dispose());
        else object.material.dispose();
      }
    });
  }
}

export class ShinHero extends BaseHero {
  constructor(scene, x = -5) {
    super(scene, x);
    this.characterId = 'shin';
  }

  buildModel() {
    const skin = material('#d9976a');
    const hair = material('#17202d', 0.9);
    const shirt = material('#ef4949', 0.68);
    const shorts = material('#ffcb3f', 0.52);
    const shoe = material('#f5f7f9', 0.4);
    const blue = material('#397dcc', 0.38);
    const dark = material('#243044');

    addBox(this.model, [0.72, 0.66, 0.42], [0, 1.18, 0], shirt);
    addBox(this.model, [0.7, 0.34, 0.43], [0, 0.68, 0], shorts);
    addSphere(this.model, 0.34, [0, 1.83, 0.01], skin, 18);
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
    this.buildLimbs({ shirt, pants: skin, shoes: shoe, accent: blue });
  }

  buildLimbs({ shirt, pants, shoes, accent }) {
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.leftLeg.position.set(-0.2, 0.55, 0);
    this.rightLeg.position.set(0.2, 0.55, 0);
    this.model.add(this.leftLeg, this.rightLeg);
    for (const leg of [this.leftLeg, this.rightLeg]) {
      addBox(leg, [0.22, 0.48, 0.24], [0, -0.18, 0], pants);
      addBox(leg, [0.34, 0.18, 0.42], [0, -0.45, 0.08], shoes);
      addBox(leg, [0.22, 0.055, 0.1], [0, -0.39, 0.27], accent, false);
    }
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftArm.position.set(-0.43, 1.43, 0);
    this.rightArm.position.set(0.43, 1.43, 0);
    this.model.add(this.leftArm, this.rightArm);
    for (const arm of [this.leftArm, this.rightArm]) {
      addBox(arm, [0.2, 0.55, 0.22], [0, -0.22, 0], shirt);
      addSphere(arm, 0.12, [0, -0.52, 0], material('#d9976a'), 10);
    }
  }
}

export class NobiHero extends BaseHero {
  constructor(scene, x = -5) {
    super(scene, x);
    this.characterId = 'nobi';
    this.maxAirJumps = 1;
    this.body.maxAirJumps = this.maxAirJumps;
    this.body.airJumpsRemaining = this.maxAirJumps;
    this.canGlide = true;
    this.gadgetVision = false;
  }

  buildModel() {
    const skin = material('#d99a72');
    const hair = material('#24202a', 0.94);
    const hoodie = material('#2677d8', 0.7);
    const hoodDark = material('#1554a4', 0.72);
    const pants = material('#29374d', 0.83);
    const green = material('#58c56c', 0.42);
    const black = material('#202b3a', 0.55);
    addBox(this.model, [0.82, 0.82, 0.48], [0, 1.2, 0], hoodie);
    addBox(this.model, [0.34, 0.18, 0.12], [0, 1.65, 0.27], hoodDark);
    addSphere(this.model, 0.34, [0, 1.91, 0.02], skin, 18);
    addSphere(this.model, 0.35, [0, 2.02, -0.06], hair, 18).scale.set(1, 0.68, 1);
    // Round glasses with two dark frames and bright lenses.
    const frame = material('#182b47', 0.3, 0.45);
    const lens = material('#b9e9ff', 0.18, 0.15);
    for (const x of [-0.145, 0.145]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.027, 8, 20), frame);
      ring.position.set(x, 1.93, 0.32);
      this.model.add(ring);
      addSphere(this.model, 0.075, [x, 1.93, 0.315], lens, 12);
    }
    addBox(this.model, [0.12, 0.035, 0.04], [0, 1.94, 0.32], frame, false);
    addBox(this.model, [0.75, 0.12, 0.12], [0, 0.78, 0.27], hoodDark);
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.leftLeg.position.set(-0.22, 0.59, 0);
    this.rightLeg.position.set(0.22, 0.59, 0);
    this.model.add(this.leftLeg, this.rightLeg);
    for (const leg of [this.leftLeg, this.rightLeg]) {
      addBox(leg, [0.25, 0.62, 0.27], [0, -0.25, 0], pants);
      addBox(leg, [0.37, 0.17, 0.47], [0, -0.59, 0.08], green);
    }
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftArm.position.set(-0.49, 1.46, 0);
    this.rightArm.position.set(0.49, 1.46, 0);
    this.model.add(this.leftArm, this.rightArm);
    for (const arm of [this.leftArm, this.rightArm]) {
      addBox(arm, [0.23, 0.62, 0.26], [0, -0.25, 0], hoodie);
      addSphere(arm, 0.13, [0, -0.58, 0.03], skin, 10);
    }
    addBox(this.model, [0.55, 0.65, 0.28], [0, 1.28, -0.36], hoodDark);
    // A small twin-blade propeller signals Nobi's aerial ability.
    this.rotor = new THREE.Group();
    this.rotor.position.set(0, 2.31, -0.03);
    this.model.add(this.rotor);
    addBox(this.rotor, [0.7, 0.055, 0.12], [0, 0, 0], green);
    addBox(this.rotor, [0.055, 0.7, 0.12], [0, 0, 0], green);
    addSphere(this.rotor, 0.09, [0, 0, 0.02], material('#e6f4ff'), 10);
  }
}

export class BenjiHero extends BaseHero {
  constructor(scene, x = -5) {
    super(scene, x);
    this.characterId = 'benji';
    this.forms = ['normal', 'blaze', 'shock', 'titan'];
    this.formIndex = 0;
    this.applyForm();
  }

  buildModel() {
    const skin = material('#c9875c');
    const hair = material('#201d21', 0.92);
    this.jacketMaterial = material('#299b59', 0.64);
    this.pantsMaterial = material('#85552f', 0.78);
    this.bootMaterial = material('#172432', 0.48, 0.12);
    this.watchMaterial = material('#f4c64e', 0.32, 0.65);
    this.formGlow = material('#b7ef75', 0.3, 0.45);
    addBox(this.model, [0.84, 0.82, 0.48], [0, 1.2, 0], this.jacketMaterial);
    addBox(this.model, [0.22, 0.68, 0.08], [0, 1.17, 0.27], material('#e7e8e1', 0.68));
    addSphere(this.model, 0.34, [0, 1.92, 0], skin, 18);
    addSphere(this.model, 0.35, [0, 2.04, -0.08], hair, 16).scale.set(1, 0.62, 1);
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();
    this.leftLeg.position.set(-0.22, 0.59, 0);
    this.rightLeg.position.set(0.22, 0.59, 0);
    this.model.add(this.leftLeg, this.rightLeg);
    for (const leg of [this.leftLeg, this.rightLeg]) {
      addBox(leg, [0.27, 0.62, 0.28], [0, -0.25, 0], this.pantsMaterial);
      addBox(leg, [0.4, 0.2, 0.48], [0, -0.59, 0.08], this.bootMaterial);
    }
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftArm.position.set(-0.5, 1.46, 0);
    this.rightArm.position.set(0.5, 1.46, 0);
    this.model.add(this.leftArm, this.rightArm);
    for (const arm of [this.leftArm, this.rightArm]) {
      addBox(arm, [0.23, 0.62, 0.25], [0, -0.23, 0], this.jacketMaterial);
      addSphere(arm, 0.13, [0, -0.56, 0.03], skin, 10);
    }
    // The gold watch on Benji's left wrist remains visible in every form.
    addBox(this.leftArm, [0.22, 0.16, 0.2], [0, -0.47, 0.18], this.watchMaterial);
    this.auraRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.8, 0.035, 8, 32),
      new THREE.MeshBasicMaterial({ color: '#b7ef75', transparent: true, opacity: 0.4 })
    );
    this.auraRing.rotation.x = Math.PI / 2;
    this.auraRing.position.y = 0.07;
    this.group.add(this.auraRing);
    this.specialEffectTimer = 0;
    this.specialEffectAbility = null;
    this.specialEffects = {
      flame: new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.095, 8, 28), new THREE.MeshBasicMaterial({ color: '#ff7a27', transparent: true, opacity: 0, depthWrite: false })),
      shock: new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.065, 8, 32), new THREE.MeshBasicMaterial({ color: '#ffe85b', transparent: true, opacity: 0, depthWrite: false })),
      stomp: new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.11, 8, 32), new THREE.MeshBasicMaterial({ color: '#a9e66e', transparent: true, opacity: 0, depthWrite: false })),
    };
    this.specialEffects.flame.position.set(1.15, 1.18, 0.55);
    this.specialEffects.shock.rotation.x = Math.PI / 2;
    this.specialEffects.shock.position.set(0, 0.13, 0.5);
    this.specialEffects.stomp.rotation.x = Math.PI / 2;
    this.specialEffects.stomp.position.set(0, 0.1, 0.55);
    for (const [ability, effect] of Object.entries(this.specialEffects)) {
      effect.visible = false;
      this.group.add(effect);
    }
  }

  triggerSpecialEffect(ability) {
    if (!this.specialEffects?.[ability]) return false;
    this.specialEffectAbility = ability;
    this.specialEffectTimer = 0;
    for (const [name, effect] of Object.entries(this.specialEffects)) effect.visible = name === ability;
    return true;
  }

  update(dt, attacking = false, aerialState = {}) {
    super.update(dt, attacking, aerialState);
    if (!this.specialEffectAbility) return;
    this.specialEffectTimer += dt;
    const effect = this.specialEffects[this.specialEffectAbility];
    const visual = getBenjiSpecialVisualState(this.specialEffectAbility, this.specialEffectTimer);
    effect.scale.setScalar(visual.scale);
    effect.material.opacity = visual.opacity;
    effect.rotation.z = visual.rotation;
    if (!visual.visible) {
      effect.visible = false;
      this.specialEffectAbility = null;
      this.specialEffectTimer = 0;
    }
  }

  cycleForm() {
    this.formIndex = (this.formIndex + 1) % this.forms.length;
    this.applyForm();
    return this.forms[this.formIndex];
  }

  applyForm() {
    if (!this.forms) return;
    const form = this.forms[this.formIndex];
    const palettes = {
      normal: { jacket: '#299b59', pants: '#85552f', aura: '#b7ef75', scale: 1 },
      blaze: { jacket: '#d94b31', pants: '#6c3025', aura: '#ff9a3d', scale: 1 },
      shock: { jacket: '#386ed2', pants: '#283b68', aura: '#ffe85b', scale: 1 },
      titan: { jacket: '#5e843b', pants: '#55412b', aura: '#a9e66e', scale: 1.14 },
    };
    const palette = palettes[form];
    this.jacketMaterial.color.set(palette.jacket);
    this.pantsMaterial.color.set(palette.pants);
    this.auraRing.material.color.set(palette.aura);
    this.visualScale = palette.scale;
  }
}

export function createHero(scene, characterId, x = -5) {
  if (characterId === 'nobi') return new NobiHero(scene, x);
  if (characterId === 'benji') return new BenjiHero(scene, x);
  return new ShinHero(scene, x);
}
