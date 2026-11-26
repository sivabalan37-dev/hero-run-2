import * as THREE from 'three';
import { standard, glow } from '../utils/materials.js';
export class Coin {
  constructor(lane,z,type='coin',y=1.4){
    this.type=type;this.group=new THREE.Group();this.group.position.set([-2.6,0,2.6][lane],y,z);this.taken=false;this.phase=Math.random()*6.28;
    const color=type==='shard'?'#48dcff':type==='health'?'#ff596b':'#ffc83e';
    const gold=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:0.75,metalness:0.66,roughness:0.2});
    if(type==='coin'){
      const disc=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.11,28),gold);disc.rotation.x=Math.PI/2;disc.castShadow=true;this.group.add(disc);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(0.23,0.035,8,24),standard('#fff2ae',0.22,0.62));ring.position.z=0.07;this.group.add(ring);
    }else if(type==='shard'){
      const halo=new THREE.Mesh(new THREE.TorusGeometry(0.44,0.055,10,28),glow('#48dcff',1.3));this.group.add(halo);
      const gem=new THREE.Mesh(new THREE.OctahedronGeometry(0.32,1),new THREE.MeshPhysicalMaterial({color:'#6cecff',emissive:'#1593ca',emissiveIntensity:0.7,roughness:0.12,metalness:0.1,clearcoat:1}));gem.castShadow=true;this.group.add(gem);
    }else{
      const heart=new THREE.Group();const a=new THREE.Mesh(new THREE.SphereGeometry(0.2,14,10),gold);a.position.set(-0.14,0.1,0);heart.add(a);const b=a.clone();b.position.x=0.14;heart.add(b);
      const tip=new THREE.Mesh(new THREE.ConeGeometry(0.25,0.4,4),gold);tip.position.y=-0.16;tip.rotation.y=Math.PI/4;heart.add(tip);heart.rotation.z=Math.PI;this.group.add(heart);
    }
  }
  update(dt,time){this.group.rotation.y+=dt*2.7;this.group.position.y+=(1.4+Math.sin(time*3+this.phase)*0.16-this.group.position.y)*Math.min(1,dt*8);}
  dispose(){this.group.traverse(n=>{if(n.isMesh){n.geometry.dispose();n.material.dispose();}});this.group.parent?.remove(this.group);}
}