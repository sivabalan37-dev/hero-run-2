import { LoadingManager, TextureLoader } from 'three';
export class ResourceManager {
  constructor() { this.manager = new LoadingManager(); this.loader = new TextureLoader(this.manager); this.cache = new Map(); }
  texture(url) { if (!this.cache.has(url)) this.cache.set(url, this.loader.load(url)); return this.cache.get(url); }
  dispose() { for (const resource of this.cache.values()) resource.dispose(); this.cache.clear(); }
}