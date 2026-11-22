import * as THREE from 'three';
import { Renderer } from './Renderer.js';
import { SceneManager } from './SceneManager.js';
import { TimeManager } from './TimeManager.js';
export class Engine {
  constructor(mount, highQuality = true) {
    this.scene = new SceneManager().scene;
    this.camera = new THREE.PerspectiveCamera(53, 1, 0.1, 260);
    this.camera.position.set(0, 7.1, 13.2); this.camera.lookAt(0, 1.6, -16);
    this.renderer = new Renderer(mount, highQuality); this.time = new TimeManager();
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(mount);
    this.createLights(); this.resize();
  }
  createLights() {
    const hemi = new THREE.HemisphereLight('#f0fbff', '#547a49', 2.15); this.scene.add(hemi);
    const sun = new THREE.DirectionalLight('#fff5d5', 3.25);
    sun.position.set(-18, 28, 12); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 25, bottom: -18, near: 1, far: 95 });
    sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4; this.scene.add(sun);
    const fill = new THREE.DirectionalLight('#77d4ff', 1.0); fill.position.set(12, 11, -28); this.scene.add(fill);
    const warm = new THREE.DirectionalLight('#ffd5a2', 0.55); warm.position.set(0, 7, 18); this.scene.add(warm);
  }
  resize() {
    const canvas = this.renderer.renderer.domElement;
    const parent = canvas.parentElement; if (!parent) return;
    const w = Math.max(1, parent.clientWidth); const h = Math.max(1, parent.clientHeight);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.resize(w, h);
  }
  setQuality(high) { this.renderer.setQuality(high); }
  render() { this.renderer.render(this.scene, this.camera); }
  dispose() { this.observer.disconnect(); this.renderer.dispose(); }
}