import * as THREE from 'three';
export class Renderer {
  constructor(mount, highQuality = true) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.setQuality(highQuality);
    mount.appendChild(this.renderer.domElement);
  }
  setQuality(high) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 1.8 : 1.25));
    this.renderer.shadowMap.enabled = high;
  }
  resize(width, height) { this.renderer.setSize(width, height, false); }
  render(scene, camera) { this.renderer.render(scene, camera); }
  dispose() { this.renderer.dispose(); this.renderer.domElement.remove(); }
}