import * as THREE from 'three';
import { standard, glow } from '../utils/materials.js';
export class Enemy {
  constructor(lane,z){
    this.group=new THREE.Group();this.group.position.set([-2.6,0,2.6][lane],0,z);this.health=100;this.defeated=false;
    const green=standard('#78c833'),deep=standard('#3a8f29'),leather=standard('#87502e');
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(0.4,0.6,4,9),deep);body.position.y=0.72;body.castShadow=true;this.group.add(body);
    const belly=new THREE.Mesh(new THREE.SphereGeometry(0.31,14,10),green);belly.position.set(0,0.78,0.34);belly.scale.z=0.5;this.group.add(belly);
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.46,18,14),green);head.position.y=1.55;head.castShadow=true;this.group.add(head);
    for(const side of [-1,1]){
      const ear=new THREE.Mesh(new THREE.ConeGeometry(0.18,0.5,6),green);ear.position.set(side*0.45,1.67,0);ear.rotation.z=-side*0.85;this.group.add(ear);
      const eye=new THREE.Mesh(new THREE.SphereGeometry(0.09,12,8),glow('#f5f4b5',1));eye.position.set(side*0.16,1.62,0.42);this.group.add(eye);
      const pupil=new THREE.Mesh(new THREE.SphereGeometry(0.045,8,6),standard('#26323c'));pupil.position.set(side*0.16,1.62,0.49);this.group.add(pupil);
    }
    const tunic=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.34,0.16),leather);tunic.position.set(0,0.92,0.38);this.group.add(tunic);
    const star=new THREE.Mesh(new THREE.OctahedronGeometry(0.16,1),glow('#f6cb54',1.1));star.position.set(0,1.08,0.49);this.group.add(star);
    this.phase=Math.random()*6.28;
  }
  update(dt,time){if(this.defeated){this.group.rotation.z+=dt*3;this.group.position.y-=dt*2;return;}this.group.position.y=Math.sin(time*4+this.phase)*0.05;}
  dispose(){this.group.traverse(n=>{if(n.isMesh){n.geometry.dispose();n.material.dispose();}});this.group.parent?.remove(this.group);}
}