import * as THREE from 'three';
import { standard } from '../utils/materials.js';
export class Obstacle {
  constructor(lane,z,type='crate'){
    this.type=type;this.group=new THREE.Group();this.group.position.set([-2.6,0,2.6][lane],0,z);this.cleared=false;
    const wood=standard('#9b5d33'),dark=standard('#633a29'),metal=standard('#a8bac5',0.32,0.58);
    if(type==='spikes'){
      const base=new THREE.Mesh(new THREE.BoxGeometry(1.45,0.2,0.95),dark);base.position.y=0.1;this.group.add(base);
      for(let i=0;i<4;i++){const spike=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.82,7),metal);spike.position.set(-0.5+i*0.33,0.58,0);spike.castShadow=true;this.group.add(spike);}
    }else if(type==='log'){
      const log=new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.42,1.7,12),wood);log.rotation.z=Math.PI/2;log.position.y=1.3;log.castShadow=true;this.group.add(log);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(0.4,0.06,7,14),metal);ring.rotation.y=Math.PI/2;ring.position.set(0.55,1.3,0);this.group.add(ring);
    }else{
      const crate=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.25,0.95),wood);crate.position.y=0.63;crate.castShadow=true;crate.receiveShadow=true;this.group.add(crate);
      for(let i=0;i<3;i++){const plank=new THREE.Mesh(new THREE.BoxGeometry(1.23,0.12,1),dark);plank.position.set(0,0.23+i*0.4,0.02);this.group.add(plank);}
      const band=new THREE.Mesh(new THREE.BoxGeometry(0.12,1.28,1.02),metal);band.position.set(-0.4,0.63,0.02);this.group.add(band);
    }
  }
  update(_dt){this.group.rotation.y=Math.sin(performance.now()*0.001)*0.018;}
  dispose(){this.group.traverse(n=>{if(n.isMesh){n.geometry.dispose();n.material.dispose();}});this.group.parent?.remove(this.group);}
}