import * as THREE from 'three';
import { standard, glow } from '../utils/materials.js';

export class LevelGenerator {
  constructor(scene) {
    this.scene = scene; this.group = new THREE.Group(); scene.add(this.group);
    this.tiles = []; this.clouds = []; this.waterfalls = []; this.decor = [];
    this.makeBase(); this.makeSky(); this.makeFloatingIslands(); this.makeCastle(); this.makeTrees(); this.makeBridge(); this.makeBanners();
  }
  add(mesh, parent = this.group) { mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; }
  makeBase() {
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(11.7, 1.7, 255), standard('#8c542e', 0.96));
    cliff.position.set(0, -0.9, -105); this.add(cliff);
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(11.1, 255), standard('#54bd48', 0.96));
    grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.035, -105); grass.receiveShadow = true; this.group.add(grass);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 255), standard('#9dba65', 0.96));
    path.rotation.x = -Math.PI / 2; path.position.set(0, 0.015, -105); this.group.add(path);
    const stone = standard('#8799a2', 0.85), edge = standard('#536d75', 0.88);
    for (let row = 0; row < 52; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const tile = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.075, 2.25), row % 3 === 0 ? edge : stone);
        tile.position.set(-2.55 + col * 2.55, 0.055, 8 - row * 4.5);
        tile.rotation.y = (Math.random() - 0.5) * 0.025;
        this.group.add(tile); this.tiles.push(tile);
      }
    }
    const dirt = standard('#a96639', 0.94), moss = standard('#4a9c48', 0.95);
    for (const side of [-1, 1]) {
      const lip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 255), moss);
      lip.position.set(side * 5.5, -0.04, -105); this.group.add(lip);
      for (let i = 0; i < 30; i += 1) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.55, 0), dirt);
        rock.position.set(side * (5.2 + Math.random() * 0.45), -0.6 - Math.random() * 0.6, 6 - i * 8.4);
        rock.scale.set(1.25, 0.65, 0.9); this.group.add(rock);
      }
    }
  }
  makeSky() {
    const sun = new THREE.Mesh(new THREE.SphereGeometry(4.7, 32, 24), new THREE.MeshBasicMaterial({ color: '#fff1b2' }));
    sun.position.set(-25, 29, -125); this.group.add(sun);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(6, 0.12, 8, 64), glow('#ffe3a1', 0.7));
    halo.position.copy(sun.position); halo.rotation.x = 0.3; this.group.add(halo);
    const mountainMat = standard('#8cb5cc', 1), farMat = standard('#b1d4e5', 1);
    for (let i = 0; i < 16; i += 1) {
      const side = i % 2 ? 1 : -1, h = 13 + (i % 5) * 3;
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(8 + (i % 4) * 2, h, 6), i % 3 ? mountainMat : farMat);
      mountain.position.set(side * (17 + (i % 4) * 8), h * 0.43, -37 - i * 9); mountain.rotation.y = i * 0.61; this.group.add(mountain);
    }
    const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.82 });
    for (let i = 0; i < 15; i += 1) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 5; j += 1) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.15 + (j % 2) * 0.5, 14, 10), cloudMat);
        puff.position.set(j * 1.25, Math.sin(j * 1.5) * 0.28, 0); puff.scale.y = 0.62; cloud.add(puff);
      }
      cloud.position.set(-27 + (i % 9) * 7, 16 + (i % 4) * 3, -25 - i * 11);
      this.group.add(cloud); this.clouds.push(cloud);
    }
  }
  makeIsland(x, y, z, scale = 1, withTree = true) {
    const island = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(3.5, 1), standard('#9a6039', 0.98));
    rock.scale.set(1.25, 0.82, 1); rock.position.y = -1.1; island.add(rock);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(4.15, 3.7, 0.65, 9), standard('#5c9e46', 0.95));
    top.position.y = 0.08; top.castShadow = true; island.add(top);
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.8, 0.42, 9), standard('#a96a3c', 0.96));
    soil.position.y = -0.38; island.add(soil);
    for (let i = 0; i < 7; i += 1) {
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.8 + (i % 3) * 0.28, 5), standard(i % 2 ? '#61c6cf' : '#8d83d8', 0.35, 0.15));
      const a = i * Math.PI * 2 / 7; crystal.position.set(Math.cos(a) * 3.2, -0.45, Math.sin(a) * 2.8); island.add(crystal);
    }
    if (withTree) this.addTreeTo(island, 0, 0.4, -0.4, 0.8 + Math.random() * 0.3);
    island.position.set(x, y, z); island.scale.setScalar(scale); this.group.add(island);
    return island;
  }
  addTreeTo(parent, x, y, z, s = 1) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.8, 8), standard('#80503a'));
    trunk.position.y = 0.85; trunk.castShadow = true; tree.add(trunk);
    const greens = ['#238f51', '#34ad55', '#64c94c'];
    for (let i = 0; i < 4; i += 1) {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.85 - i * 0.08, 12, 10), standard(greens[i % greens.length], 0.88));
      crown.position.set((i - 1.5) * 0.24, 1.6 + (i % 2) * 0.35, (i % 2) * 0.22); crown.scale.y = 0.85; crown.castShadow = true; tree.add(crown);
    }
    tree.position.set(x, y, z); tree.scale.setScalar(s); parent.add(tree); return tree;
  }
  makeFloatingIslands() {
    const islands = [[-15,9,-30,1.05],[15,12,-48,1.25],[-19,14,-70,0.82],[18,9,-87,0.92],[-7,18,-110,0.65],[26,17,-128,1.05]];
    for (const island of islands) this.makeIsland(...island, Math.random() > 0.25);
    const waterMat = new THREE.MeshBasicMaterial({ color: '#39c9f6', transparent: true, opacity: 0.62, side: THREE.DoubleSide });
    for (const [x,y,z,h] of [[13,6,-58,11],[-18,4,-92,9]]) {
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(2.5,h,1,12), waterMat.clone());
      sheet.position.set(x,y,z); sheet.rotation.y = -0.16; this.group.add(sheet); this.waterfalls.push(sheet);
      const foamMat = new THREE.MeshBasicMaterial({color:'#d9fbff',transparent:true,opacity:0.68});
      for(let i=0;i<5;i++){const foam=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,6),foamMat);foam.position.set(x-0.7+i*0.34,y-h/2,z);this.group.add(foam);}
    }
  }
  makeCastle() {
    const castle = new THREE.Group();
    const stone = standard('#e6d6c1', 0.88), pale = standard('#f7e5c7', 0.84), roof = standard('#bb4b70', 0.48, 0.12), gold = standard('#ffdc77',0.35,0.25);
    const keep = new THREE.Mesh(new THREE.BoxGeometry(12,7,6),stone); keep.position.y=3.6; keep.castShadow=true; castle.add(keep);
    for(const [x,z,h] of [[-5,-2,11],[5,-2,12],[-5,2,9],[5,2,10],[0,-2.5,13]]){
      const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.5,h,12),pale);tower.position.set(x,h/2+3,z);tower.castShadow=true;castle.add(tower);
      const top=new THREE.Mesh(new THREE.ConeGeometry(1.62,3.4,8),roof);top.position.set(x,h+4.7,z);top.castShadow=true;castle.add(top);
      const orb=new THREE.Mesh(new THREE.SphereGeometry(0.22,10,8),gold);orb.position.set(x,h+6.3,z);castle.add(orb);
    }
    const gate=new THREE.Mesh(new THREE.BoxGeometry(2.2,3.5,0.22),standard('#714d57'));gate.position.set(0,1.75,3.1);castle.add(gate);
    const crest=new THREE.Mesh(new THREE.CircleGeometry(0.55,5),gold);crest.position.set(0,5.6,3.1);castle.add(crest);
    castle.position.set(2,9,-111);castle.scale.setScalar(0.92);this.group.add(castle);
  }
  makeTrees() {
    for(let i=0;i<26;i++){
      const side=i%2?1:-1, z=5-i*8.5;
      const tree=new THREE.Group();this.addTreeTo(tree,0,0,0,0.9+(i%4)*0.18);
      tree.position.set(side*(6.1+Math.random()*1.7),-0.1,z);this.group.add(tree);this.decor.push(tree);
    }
  }
  makeBridge() {
    const bridge=new THREE.Group(), wood=standard('#a96b3d'), rail=standard('#e2b77b');
    const deck=new THREE.Mesh(new THREE.BoxGeometry(8.8,0.26,3.2),wood);deck.position.y=0.85;bridge.add(deck);
    for(const side of [-1,1]){
      const beam=new THREE.Mesh(new THREE.BoxGeometry(0.18,1.35,3.35),rail);beam.position.set(side*4.2,1.42,0);bridge.add(beam);
      for(let i=0;i<6;i++){const post=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.12,1.1,8),rail);post.position.set(side*4.2,1.15,-1.35+i*0.54);bridge.add(post);}
    }
    bridge.position.set(0,0,-24);this.group.add(bridge);
  }
  makeBanners() {
    const cloth=standard('#df3f42',0.75), trim=standard('#ffd45e',0.38,0.18);
    for(const z of [-8,-31,-59]){
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,5.3,8),standard('#774d31'));pole.position.set(-5.05,2.45,z);this.group.add(pole);
      const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.75,5,5),cloth);flag.position.set(-5.62,3.05,z);flag.rotation.y=0.08;this.group.add(flag);
      const emblem=new THREE.Mesh(new THREE.OctahedronGeometry(0.28,0),trim);emblem.position.set(-5.62,3.08,z+0.03);this.group.add(emblem);
      this.decor.push(flag);
    }
  }
  update(dt,speed,time) {
    for(const tile of this.tiles){tile.position.z+=speed*dt;if(tile.position.z>12)tile.position.z-=234;}
    this.clouds.forEach((cloud,i)=>{cloud.position.x+=Math.sin(time*0.15+i)*dt*0.08;});
    this.waterfalls.forEach((sheet,i)=>{sheet.position.x+=Math.sin(time*3+i)*dt*0.025;});
    this.decor.forEach((object)=>{if(object.geometry?.type==='PlaneGeometry')object.rotation.z=Math.sin(time*2+object.position.z)*0.035;});
  }
  dispose(){this.group.traverse(n=>{if(n.isMesh){n.geometry.dispose();if(Array.isArray(n.material))n.material.forEach(m=>m.dispose());else n.material.dispose();}});this.group.parent?.remove(this.group);}
}