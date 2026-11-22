import * as THREE from 'three';
import { AdventureInput } from './Input.js';
import { ShinHero } from './Hero.js';
import { SunnyNeighborhoodLevel } from './SunnyNeighborhoodLevel.js';
import { stepBody } from './PlatformerPhysics.js';

const FIXED_STEP = 1 / 60;
const SAVE_KEY = 'hero-run-time-travel-save-v1';

function readSave() {
  try {
    const value = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (value && value.version === 1 && Number.isFinite(value.checkpointX)) {
      return { checkpointX: Math.max(-5, Math.min(22, value.checkpointX)) };
    }
  } catch { /* A damaged or blocked save is treated as a new game. */ }
  return { checkpointX: -5 };
}

function writeSave(checkpointX) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, checkpointX, savedAt: Date.now() }));
    return true;
  } catch { return false; }
}

export class AdventureGame {
  constructor({ mount }) {
    this.mount = mount;
    this.state = 'menu';
    this.accumulator = 0;
    this.lastFrame = 0;
    this.coins = 0;
    this.shards = 0;
    this.checkpointX = readSave().checkpointX;
    this.attackTimer = 0;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-12, 12, 7, -7, 0.1, 140);
    this.camera.position.set(-3.5, 3, 30);
    this.camera.lookAt(-3.5, 3, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    if (!this.renderer.capabilities.isWebGL2) {
      this.renderer.dispose();
      throw new Error('This browser does not provide WebGL 2. Please update your browser or device.');
    }
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(mount.clientWidth || window.innerWidth, mount.clientHeight || window.innerHeight, false);
    mount.appendChild(this.renderer.domElement);

    this.level = new SunnyNeighborhoodLevel(this.scene);
    this.hero = new ShinHero(this.scene, this.checkpointX);
    this.input = new AdventureInput(document);
    this.clock = new THREE.Clock();

    this.ui = {
      hud: document.querySelector('#hud'),
      overlay: document.querySelector('#overlay'),
      title: document.querySelector('#overlay-title'),
      message: document.querySelector('#overlay-message'),
      start: document.querySelector('#start-button'),
      pause: document.querySelector('#pause-button'),
      health: document.querySelector('#health-value'),
      healthFill: document.querySelector('#health-fill'),
      coins: document.querySelector('#coins-value'),
      shards: document.querySelector('#shards-value'),
      levelName: document.querySelector('#level-name'),
      toast: document.querySelector('#toast'),
      status: document.querySelector('#status-note'),
      touch: document.querySelector('#touch-controls'),
    };

    this.onResize = () => this.resize();
    this.onVisibility = () => {
      if (document.hidden && this.state === 'running') this.pause();
    };
    this.onStart = () => {
      if (this.state === 'paused') this.resume();
      else this.start();
    };
    this.onPause = () => this.state === 'running' ? this.pause() : this.state === 'paused' ? this.resume() : null;
    this.ui.start.addEventListener('click', this.onStart);
    this.ui.pause.addEventListener('click', this.onPause);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibility);

    if (matchMedia('(pointer: coarse)').matches) this.ui.touch.classList.remove('hidden');
    this.resize();
    this.showOverlay('HERO RUN', 'TIME-TRAVEL ADVENTURE', 'Help Shin recover the Time Shard in Sunny Neighborhood. Move, jump across the raised platforms, defeat Robo Bugs and reach the portal.', 'START LEVEL');
    this.frame = this.frame.bind(this);
    this.raf = requestAnimationFrame(this.frame);
  }

  resize() {
    const width = Math.max(1, this.mount.clientWidth);
    const height = Math.max(1, this.mount.clientHeight);
    const viewHeight = 14;
    const halfWidth = viewHeight * (width / height) / 2;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  showOverlay(title, subtitle, message, buttonText, status = '') {
    this.ui.title.textContent = title;
    this.ui.message.textContent = message;
    this.ui.start.textContent = buttonText;
    this.ui.status.textContent = status || subtitle;
    this.ui.overlay.classList.remove('hidden');
    this.ui.hud.classList.add('hidden');
    this.ui.touch.classList.add('hidden');
  }

  hideOverlay() {
    this.ui.overlay.classList.add('hidden');
    this.ui.hud.classList.remove('hidden');
    if (matchMedia('(pointer: coarse)').matches) this.ui.touch.classList.remove('hidden');
  }

  start() {
    if (this.state === 'completed' || this.state === 'gameover') this.resetLevel();
    this.state = 'running';
    this.accumulator = 0;
    this.clock.getDelta();
    this.input.clear();
    this.hideOverlay();
    this.updateHud();
  }

  resetLevel() {
    this.level.destroy();
    this.level = new SunnyNeighborhoodLevel(this.scene);
    this.hero.reset(this.checkpointX);
    this.coins = 0;
    this.shards = 0;
    this.attackTimer = 0;
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this.input.clear();
    this.showOverlay('PAUSED', 'Sunny Neighborhood', 'Your progress in this level is kept. Continue when you are ready.', 'RESUME');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'running';
    this.accumulator = 0;
    this.clock.getDelta();
    this.input.clear();
    this.hideOverlay();
  }

  toast(message) {
    this.ui.toast.textContent = message;
    this.ui.toast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.ui.toast.classList.add('hidden'), 1300);
  }

  updateHud() {
    this.ui.health.textContent = String(Math.max(0, Math.ceil(this.hero.health)));
    this.ui.healthFill.style.width = `${Math.max(0, this.hero.health)}%`;
    this.ui.coins.textContent = String(this.coins);
    this.ui.shards.textContent = String(this.shards);
    this.ui.levelName.textContent = 'SUNNY NEIGHBORHOOD · LEVEL 1 / 40';
    this.ui.healthFill.style.background = this.hero.health <= 30
      ? 'linear-gradient(90deg,#ff4d66,#ffad51)'
      : 'linear-gradient(90deg,#42e49a,#f6d95a)';
  }

  collect(item) {
    if (item.collected) return;
    item.collected = true;
    item.group.visible = false;
    if (item.type === 'coin') {
      this.coins += 1;
      this.toast('+1 COIN');
    } else if (item.type === 'heart') {
      this.hero.health = Math.min(100, this.hero.health + 25);
      this.toast('HEALTH RESTORED');
    } else {
      this.shards += 1;
      this.toast('TIME SHARD FOUND!');
    }
    this.updateHud();
  }

  damageHero() {
    if (this.hero.invulnerable > 0) return;
    this.hero.health = Math.max(0, this.hero.health - 25);
    this.hero.invulnerable = 1.1;
    this.toast('ROBO BUG HIT!');
    this.updateHud();
    if (this.hero.health <= 0) {
      this.state = 'gameover';
      this.input.clear();
      this.showOverlay('TRY AGAIN', 'Checkpoint ready', 'Shin ran out of health. Restart from the most recently activated checkpoint.', 'RESPAWN');
    }
  }

  fixedUpdate(dt) {
    const move = this.input.movement();
    const jumpPressed = this.input.consumePressed('jump');
    const attackPressed = this.input.consumePressed('attack');

    stepBody(this.hero.body, { move, jumpPressed }, this.level.platforms, dt, { minX: -9, maxX: 43 });
    this.level.update(dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);

    if (attackPressed && this.attackTimer <= 0) {
      this.attackTimer = 0.38;
      const body = this.hero.body;
      for (const enemy of this.level.enemies) {
        if (!enemy.alive) continue;
        const dx = enemy.x - body.x;
        if (Math.abs(dx) < 2.15 && Math.sign(dx || body.facing) === body.facing && Math.abs(body.y - 0) < 1.2) {
          enemy.alive = false;
          enemy.group.visible = false;
          this.coins += 2;
          this.toast('ROBO BUG DEFEATED · +2');
          break;
        }
      }
    }

    const body = this.hero.body;
    for (const item of this.level.collectibles) {
      if (item.collected) continue;
      const dx = Math.abs(body.x - item.x);
      const dy = Math.abs(body.y + body.height * 0.55 - item.y);
      if (dx < 0.82 && dy < 1.2) this.collect(item);
    }

    for (const enemy of this.level.enemies) {
      if (!enemy.alive) continue;
      if (Math.abs(body.x - enemy.x) < 0.88 && body.y < 1.05 && this.hero.invulnerable <= 0) {
        this.damageHero();
      }
    }

    if (!this.level.checkpointActivated && body.x >= this.level.checkpointX) {
      this.level.checkpointActivated = true;
      this.checkpointX = this.level.checkpointX;
      writeSave(this.checkpointX);
      this.toast('CHECKPOINT SAVED');
    }

    if (body.y < -9) {
      body.x = this.checkpointX;
      body.y = 0;
      body.vx = 0;
      body.vy = 0;
      body.grounded = false;
      this.damageHero();
    }

    if (body.x >= this.level.exitX) {
      if (this.shards > 0) {
        this.state = 'completed';
        this.input.clear();
        this.showOverlay('LEVEL COMPLETE!', 'Time Shard recovered', `Sunny Neighborhood cleared. Coins collected: ${this.coins}. Next up: School Playground.`, 'PLAY AGAIN');
      } else {
        body.x = this.level.exitX - 1.2;
        this.toast('FIND THE TIME SHARD FIRST');
      }
    }

    this.hero.update(dt, this.attackTimer > 0);
    this.updateHud();
    this.input.endStep();
  }

  frame() {
    this.raf = requestAnimationFrame(this.frame);
    const elapsed = Math.min(this.clock.getDelta(), 0.1);
    if (this.state === 'running') {
      this.accumulator = Math.min(this.accumulator + elapsed, FIXED_STEP * 6);
      let steps = 0;
      while (this.accumulator >= FIXED_STEP && steps < 6 && this.state === 'running') {
        this.fixedUpdate(FIXED_STEP);
        this.accumulator -= FIXED_STEP;
        steps++;
      }
    } else {
      this.accumulator = 0;
    }

    const targetX = Math.max(-4, Math.min(28, this.hero.body.x + 1.5));
    this.camera.position.x += (targetX - this.camera.position.x) * 0.09;
    this.camera.lookAt(this.camera.position.x, 3, 0);
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.toastTimer);
    this.input.destroy();
    this.ui.start.removeEventListener('click', this.onStart);
    this.ui.pause.removeEventListener('click', this.onPause);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.level.destroy();
    this.renderer.dispose();
    this.mount.replaceChildren();
  }
}
