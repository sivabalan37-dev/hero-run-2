import * as THREE from 'three';
import { standard } from '../utils/materials.js';
export class Player {
  constructor(scene, palette) {
    this.group = new THREE.Group(); scene.add(this.group); this.parts = {};
    const skin = standard(palette.skin), hair = standard(palette.hair), shirt = standard(palette.shirt);
    const capeMat = new THREE.MeshStandardMaterial({ color: palette.cape, roughness: 0.72, side: THREE.DoubleSide });
    const trim = standard(palette.trim, 0.35, 0.25), boot = standard('#443243');
    const model = new THREE.Group(); this.group.add(model); this.model = model;
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36,0.52,5,10), shirt);
    torso.position.y=1.14; torso.castShadow=true; model.add(torso);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.3,0.05,7,20), trim);
    belt.rotation.x=Math.PI/2; belt.position.set(0,0.96,0); model.add(belt);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42,24,18), skin);
    head.position.set(0,1.96,0.04); head.scale.set(1,1.05,0.92); head.castShadow=true; model.add(head);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45,20,12,0,Math.PI*2,0,1.22), hair);
    cap.position.set(0,2.1,0.01); cap.castShadow=true; model.add(cap);
    for(let i=0;i<5;i++){const spike=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.34+(i%2)*0.08,7),hair);spike.position.set(-0.3+i*0.15,2.34+(i%2)*0.04,0.04);spike.rotation.z=-0.25+i*0.12;model.add(spike);}
    const eyeWhite=standard('#fffefa',0.25), pupil=standard('#17243b',0.25);
    for(const x of [-0.16,0.16]){
      const eye=new THREE.Mesh(new THREE.SphereGeometry(0.08,12,8),eyeWhite);eye.position.set(x,1.99,0.39);model.add(eye);
      const iris=new THREE.Mesh(new THREE.SphereGeometry(0.047,10,8),pupil);iris.position.set(x+0.01,1.99,0.455);model.add(iris);
      const brow=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.045,0.05),hair);brow.position.set(x,2.14,0.37);model.add(brow);
    }
    const cape=new THREE.Mesh(new THREE.PlaneGeometry(0.94,1.28,4,6),capeMat);
    cape.position.set(0,1.25,-0.42);cape.rotation.x=0.12;model.add(cape);this.parts.cape=cape;
    const backpack=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.46,0.22),standard('#86532f'));
    backpack.position.set(0,1.3,-0.35);model.add(backpack);
    const gem=new THREE.Mesh(new THREE.OctahedronGeometry(0.13,1),standard('#55e6ff',0.2,0.2));
    gem.position.set(0,1.36,-0.49);model.add(gem);
    this.parts.arms=[];this.parts.legs=[];
    for(const side of [-1,1]){
      const arm=new THREE.Group();arm.position.set(side*0.43,1.4,0);
      const upper=new THREE.Mesh(new THREE.CapsuleGeometry(0.13,0.32,4,8),shirt);upper.position.y=-0.18;upper.rotation.z=side*0.2;upper.castShadow=true;arm.add(upper);
      const hand=new THREE.Mesh(new THREE.SphereGeometry(0.13,12,8),skin);hand.position.y=-0.43;arm.add(hand);model.add(arm);this.parts.arms.push(arm);
      const leg=new THREE.Group();leg.position.set(side*0.2,0.72,0);
      const thigh=new THREE.Mesh(new THREE.CapsuleGeometry(0.15,0.35,4,8),shirt);thigh.position.y=-0.18;thigh.castShadow=true;leg.add(thigh);
      const shoe=new THREE.Mesh(new THREE.BoxGeometry(0.33,0.18,0.43),boot);shoe.position.set(0,-0.45,0.1);shoe.castShadow=true;leg.add(shoe);
      const sole=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.05,0.44),trim);sole.position.set(0,-0.55,0.1);leg.add(sole);
      model.add(leg);this.parts.legs.push(leg);
    }
    this.parts.model=model;
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(0.62,24),new THREE.MeshBasicMaterial({color:'#1e4d55',transparent:true,opacity:0.2,depthWrite:false}));
    shadow.rotation.x=-Math.PI/2;shadow.position.y=0.035;this.group.add(shadow);this.parts.shadow=shadow;
    const shield=new THREE.Mesh(new THREE.TorusGeometry(0.6,0.04,7,32),new THREE.MeshBasicMaterial({color:'#80e8ff',transparent:true,opacity:0}));
    shield.rotation.x=Math.PI/2;shield.position.y=0.08;this.group.add(shield);this.parts.shield=shield;
    this.runTime=0;
  }
  setVisible(value){this.group.visible=value;}
  updateAnimation(dt, jumping, sliding, hitFlash, shieldActive) {
    this.runTime += dt * (jumping ? 4 : 12);
    const stride = jumping || sliding ? 0 : Math.sin(this.runTime)*0.72;
    this.parts.legs[0].rotation.x = stride; this.parts.legs[1].rotation.x = -stride;
    this.parts.arms[0].rotation.x = -stride*0.95; this.parts.arms[1].rotation.x = stride*0.95;
    this.parts.model.position.y = jumping ? 0 : Math.abs(Math.sin(this.runTime*2))*0.07;
    this.parts.model.rotation.z = sliding ? -0.35 : 0;
    this.parts.model.scale.y = sliding ? 0.62 : 1;
    this.parts.cape.rotation.x = 0.12 + Math.sin(this.runTime*0.6)*0.12;
    this.parts.shadow.scale.setScalar(jumping?0.62:1);
    this.parts.shadow.material.opacity = jumping?0.1:0.2;
    this.parts.shield.material.opacity = shieldActive?0.82:0;
    if(hitFlash) this.parts.model.rotation.y = Math.sin(this.runTime*14)*0.12;
    else this.parts.model.rotation.y = 0;
  }
  dispose(){
    this.group.traverse((node)=>{if(node.isMesh){node.geometry.dispose();if(Array.isArray(node.material))node.material.forEach(m=>m.dispose());else node.material.dispose();}});
    this.group.parent?.remove(this.group);
  }
}