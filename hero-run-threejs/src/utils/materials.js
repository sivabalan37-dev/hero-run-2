import * as THREE from 'three';
export const standard = (color, roughness = 0.76, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
export const glow = (color, intensity = 1.25) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.35, metalness: 0.08 });
