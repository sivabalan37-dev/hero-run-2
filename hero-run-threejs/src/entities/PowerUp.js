import * as THREE from 'three';
import { glow } from '../utils/materials.js';
export class PowerUp {
  constructor(type,lane,z){
    this.type=type;this.group=new THREE.Group();this.group.position.set([-2.6,0,2.6][lane],1.55,z);this.taken=false;this.phase=Math.random()*6;
    const color=type==='shield'?'#5ee3ff':type==='magnet'?'#b784ff':'#ffe176';
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.48,0.07,9,28),glow(color,1.4));this.group.add(ring);
    const gem=new THREE.Mesh(new THREE.IcosahedronGeometry(0.33,1),new THREE.MeshPhysicalMaterial({color,emissive:color,emissiveIntensity:0.75,roughness:0.16,metalness:0.12,clearcoat:1}));gem.castShadow=true;this.group.add(gem);
  }
  update(dt,time){this.group.rotation.y+=dt*1.25;this.group.position.y=1.55+Math.sin(time*3.2+this.phase)*0.17;}
  dispose(){this.group.traverse(n=>{if(n.isMesh){n.geometry.dispose();n.material.dispose();}});this.group.parent?.remove(this.group);}
}