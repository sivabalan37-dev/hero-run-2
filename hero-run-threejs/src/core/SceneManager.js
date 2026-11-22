import * as THREE from 'three';
export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#6bcaff');
    this.scene.fog = new THREE.Fog('#bdeaff', 64, 185);
  }
}