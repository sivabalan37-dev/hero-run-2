import * as THREE from 'three';

const normalize = value => String(value ?? '').trim().toLowerCase().replace(/[ _-]+/g, '');

export class CharacterAnimationController {
  constructor(root, clips = []) {
    if (!root?.isObject3D) throw new TypeError('An Object3D root is required for character animations.');
    this.root = root;
    this.mixer = new THREE.AnimationMixer(root);
    this.clips = new Map();
    this.actions = new Map();
    this.baseAction = null;
    this.overlayAction = null;
    this.disposed = false;
    for (const clip of clips) {
      if (!clip?.name || !Number.isFinite(clip.duration) || clip.duration <= 0) continue;
      this.clips.set(normalize(clip.name), clip);
    }
  }

  hasClip(name) {
    return this.clips.has(normalize(name));
  }

  getClipNames() {
    return [...this.clips.values()].map(clip => clip.name);
  }

  actionFor(name) {
    const clip = this.clips.get(normalize(name));
    if (!clip) return null;
    const key = normalize(clip.name);
    if (!this.actions.has(key)) this.actions.set(key, this.mixer.clipAction(clip));
    return this.actions.get(key);
  }

  play(name, { fade = 0.18, loop = true, timeScale = 1, layer = 'base' } = {}) {
    if (this.disposed) return false;
    const next = this.actionFor(name);
    if (!next) return false;
    next.enabled = true;
    next.paused = false;
    next.reset();
    next.timeScale = Number.isFinite(timeScale) ? timeScale : 1;
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.setEffectiveWeight(1);
    next.fadeIn(Math.max(0, fade));
    next.play();

    if (layer === 'overlay') {
      if (this.overlayAction && this.overlayAction !== next) this.overlayAction.fadeOut(Math.max(0, fade));
      this.overlayAction = next;
    } else {
      if (this.baseAction && this.baseAction !== next) this.baseAction.crossFadeTo(next, Math.max(0, fade), false);
      this.baseAction = next;
    }
    return true;
  }

  stopOverlay(fade = 0.12) {
    if (!this.overlayAction) return;
    this.overlayAction.fadeOut(Math.max(0, fade));
    this.overlayAction = null;
  }

  update(deltaSeconds) {
    if (!this.disposed && Number.isFinite(deltaSeconds) && deltaSeconds > 0) {
      this.mixer.update(Math.min(deltaSeconds, 0.1));
    }
  }

  dispose() {
    if (this.disposed) return;
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
    this.actions.clear();
    this.clips.clear();
    this.baseAction = null;
    this.overlayAction = null;
    this.disposed = true;
  }
}
