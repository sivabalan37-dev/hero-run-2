import * as THREE from 'three';
import { AdventureInput } from './Input.js';
import { createHero } from './Hero.js';
import { SunnyNeighborhoodLevel } from './SunnyNeighborhoodLevel.js';
import { stepBody } from './PlatformerPhysics.js';
import { ToyStarPool } from './Combat.js';
import {
  getUnlockedCharacters,
  loadCampaignProgress,
  recordLevelCompletion,
  saveCampaignProgress,
  selectCharacter,
} from './CampaignProgress.js';
import { getLevelInfo, PLAYABLE_LEVELS } from './LevelCatalog.js';

const FIXED_STEP = 1 / 60;
const CHECKPOINT_KEY = 'hero-run-time-travel-save-v1';

function readCheckpoint(levelNumber) {
  try {
    const value = JSON.parse(localStorage.getItem(CHECKPOINT_KEY) || 'null');
    const savedLevel = Number.isInteger(value?.levelNumber) ? value.levelNumber : 1;
    if (value?.version === 1 && savedLevel === levelNumber && Number.isFinite(value.checkpointX)) {
      return Math.max(-5, Math.min(26, value.checkpointX));
    }
  } catch { /* Treat corrupt or blocked checkpoint storage as a fresh checkpoint. */ }
  return -5;
}

function writeCheckpoint(checkpointX, levelNumber) {
  try {
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify({
      version: 1,
      levelNumber,
      checkpointX,
      savedAt: Date.now(),
    }));
    return true;
  } catch { return false; }
}

export class AdventureGame {
  constructor({ mount }) {
    this.mount = mount;
    this.state = 'menu';
    this.accumulator = 0;
    this.coins = 0;
    this.shards = 0;
    this.progress = loadCampaignProgress();
    this.levelNumber = Math.min(this.progress.currentLevel, Math.max(...PLAYABLE_LEVELS));
    this.checkpointX = readCheckpoint(this.levelNumber);
    this.attackTimer = 0;
    this.specialTimer = 0;

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

    this.level = this.createLevel(this.levelNumber);
    this.hero = createHero(this.scene, this.progress.selectedCharacter, this.checkpointX);
    this.projectiles = new ToyStarPool(this.scene);
    this.input = new AdventureInput(document);
    this.clock = new THREE.Clock();

    this.ui = {
      hud: document.querySelector('#hud'),
      overlay: document.querySelector('#overlay'),
      title: document.querySelector('#overlay-title'),
      message: document.querySelector('#overlay-message'),
      start: document.querySelector('#start-button'),
      pause: document.querySelector('#pause-button'),
      heroSwitch: document.querySelector('#hero-switch'),
      health: document.querySelector('#health-value'),
      healthFill: document.querySelector('#health-fill'),
      coins: document.querySelector('#coins-value'),
      shards: document.querySelector('#shards-value'),
      levelName: document.querySelector('#level-name'),
      heroName: document.querySelector('#hero-name'),
      toast: document.querySelector('#toast'),
      status: document.querySelector('#status-note'),
      touch: document.querySelector('#touch-controls'),
      transform: document.querySelector('[data-action="transform"]'),
      special: document.querySelector('[data-action="special"]'),
    };

    this.onResize = () => this.resize();
    this.onVisibility = () => {
      if (document.hidden && this.state === 'running') this.pause();
    };
    this.onStart = () => {
      if (this.state === 'paused') this.resume();
      else this.start();
    };
    this.onPause = () => this.state === 'running'
      ? this.pause()
      : this.state === 'paused' ? this.resume() : null;
    this.onHeroSwitch = () => this.switchCharacter();
    this.ui.start.addEventListener('click', this.onStart);
    this.ui.pause.addEventListener('click', this.onPause);
    this.ui.heroSwitch.addEventListener('click', this.onHeroSwitch);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibility);

    if (matchMedia('(pointer: coarse)').matches) this.ui.touch.classList.remove('hidden');
    this.resize();
    const info = getLevelInfo(this.levelNumber);
    this.showOverlay(
      'HERO RUN',
      'TIME-TRAVEL ADVENTURE',
      `Help ${this.hero.characterId[0].toUpperCase() + this.hero.characterId.slice(1)} recover the Time Shard in ${info.world}. Collect items, defeat Robo Bugs and reach the portal.`,
      'START LEVEL',
      `${info.title.toUpperCase()} · ${this.progress.completedLevels.length} LEVELS CLEARED`
    );
    this.frame = this.frame.bind(this);
    this.raf = requestAnimationFrame(this.frame);
    this.updateHud();
  }

  createLevel(levelNumber) {
    return new SunnyNeighborhoodLevel(this.scene, { levelNumber });
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
    if (this.state === 'completed') {
      this.levelNumber = Math.min(this.progress.currentLevel, Math.max(...PLAYABLE_LEVELS));
      this.checkpointX = readCheckpoint(this.levelNumber);
      this.resetLevel();
    } else if (this.state === 'gameover') {
      this.checkpointX = readCheckpoint(this.levelNumber);
      this.resetLevel();
    }
    this.state = 'running';
    this.accumulator = 0;
    this.clock.getDelta();
    this.input.clear();
    this.hideOverlay();
    this.updateHud();
  }

  resetLevel() {
    this.level.destroy();
    this.level = this.createLevel(this.levelNumber);
    this.hero.reset(this.checkpointX);
    this.coins = 0;
    this.shards = 0;
    this.attackTimer = 0;
    this.specialTimer = 0;
    this.projectiles.clear();
    this.updateHud();
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this.input.clear();
    this.showOverlay('PAUSED', getLevelInfo(this.levelNumber).world, 'Your progress in this level is kept. Continue when you are ready.', 'RESUME');
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
    const info = getLevelInfo(this.levelNumber);
    this.ui.health.textContent = String(Math.max(0, Math.ceil(this.hero.health)));
    this.ui.healthFill.style.width = `${Math.max(0, this.hero.health)}%`;
    this.ui.coins.textContent = String(this.coins);
    this.ui.shards.textContent = String(this.shards);
    this.ui.levelName.textContent = `${info.world.toUpperCase()} · LEVEL ${this.levelNumber} / 40`;
    this.ui.heroName.textContent = this.hero.characterId.toUpperCase();
    this.ui.heroSwitch.textContent = `HERO: ${this.hero.characterId.toUpperCase()}`;
    this.ui.healthFill.style.background = this.hero.health <= 30
      ? 'linear-gradient(90deg,#ff4d66,#ffad51)'
      : 'linear-gradient(90deg,#42e49a,#f6d95a)';
    this.ui.transform.classList.toggle('hidden', this.hero.characterId !== 'benji');
    this.ui.special.textContent = this.hero.characterId === 'nobi' ? 'GADGET' : 'BURST';
  }

  switchCharacter() {
    if (this.state !== 'running' && this.state !== 'menu' && this.state !== 'paused') return;
    const unlocked = getUnlockedCharacters(this.progress);
    if (unlocked.length < 2) {
      this.toast('NOBI UNLOCKS AFTER LEVEL 3');
      return;
    }
    const currentIndex = unlocked.indexOf(this.hero.characterId);
    const nextId = unlocked[(currentIndex + 1) % unlocked.length];
    const nextProgress = selectCharacter(this.progress, nextId);
    if (!nextProgress) return;

    const oldHero = this.hero;
    const position = { ...oldHero.body };
    const health = oldHero.health;
    const invulnerable = oldHero.invulnerable;
    this.hero = createHero(this.scene, nextId, position.x);
    this.hero.body = position;
    this.hero.health = health;
    this.hero.invulnerable = invulnerable;
    this.hero.syncVisual();
    oldHero.destroy();
    this.progress = nextProgress;
    saveCampaignProgress(this.progress);
    this.projectiles.clear();
    this.toast(`${nextId.toUpperCase()} SELECTED`);
    this.updateHud();
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

  completeLevel() {
    const alreadyCompleted = this.progress.completedLevels.includes(this.levelNumber);
    if (!alreadyCompleted) {
      this.progress = recordLevelCompletion(this.progress, this.levelNumber, this.coins);
      saveCampaignProgress(this.progress);
    }
    this.state = 'completed';
    this.input.clear();
    const nextLevel = this.progress.currentLevel;
    const nextInfo = nextLevel <= 40 ? getLevelInfo(nextLevel) : null;
    const newlyUnlocked = getUnlockedCharacters(this.progress);
    const nobiUnlocked = newlyUnlocked.includes('nobi') && !this._nobiUnlockAnnounced;
    const benjiUnlocked = newlyUnlocked.includes('benji') && !this._benjiUnlockAnnounced;
    if (nobiUnlocked) this._nobiUnlockAnnounced = true;
    if (benjiUnlocked) this._benjiUnlockAnnounced = true;
    let message = `${getLevelInfo(this.levelNumber).title} cleared. Coins collected: ${this.coins}.`;
    if (nobiUnlocked) message += ' Nobi is now unlocked!';
    if (benjiUnlocked) message += ' Benji is now unlocked!';
    const nextIsPlayable = PLAYABLE_LEVELS.includes(nextLevel);
    if (nextIsPlayable) {
      message += ` Next: ${nextInfo.title}.`;
      this.showOverlay('LEVEL COMPLETE!', 'Time Shard recovered', message, `PLAY LEVEL ${nextLevel}`);
    } else {
      message += ' Your campaign progress is saved. The next stage is not built yet; you can replay the latest playable level.';
      this.showOverlay('LEVEL COMPLETE!', 'Time Shard recovered', message, 'REPLAY LEVEL');
    }
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
    const specialPressed = this.input.consumePressed('special');
    const switchPressed = this.input.consumePressed('switch');
    const transformPressed = this.input.consumePressed('transform');

    if (switchPressed) this.switchCharacter();
    if (transformPressed) {
      if (this.hero.characterId === 'benji') {
        const form = this.hero.cycleForm();
        this.toast(`BENJI: ${form.toUpperCase()} FORM`);
      }
    }

    const body = this.hero.body;
    const glide = this.hero.characterId === 'nobi' && !body.grounded && this.input.isDown('jump');
    stepBody(body, { move, jumpPressed, glide }, this.level.platforms, dt, { minX: -9, maxX: 45 });
    this.level.update(dt, body);
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.specialTimer = Math.max(0, this.specialTimer - dt);

    if (attackPressed && this.attackTimer <= 0) {
      if (this.projectiles.fireToyStar(body.x, body.y + 1.28, body.facing)) {
        this.attackTimer = 0.34;
      }
    }
    if (specialPressed && this.specialTimer <= 0) {
      if (this.hero.characterId === 'nobi') {
        const revealed = this.level.revealHidden();
        this.hero.gadgetVision = true;
        this.specialTimer = 4.2;
        this.toast(revealed ? `GADGET VISION · ${revealed} SECRET REVEALED` : 'GADGET VISION · AREA SCANNED');
      } else {
        const fired = this.projectiles.fireStarBurst(body.x, body.y + 1.18, body.facing);
        if (fired > 0) {
          this.specialTimer = 4.2;
          this.toast('STAR BURST!');
        }
      }
    }

    const combatResult = this.projectiles.update(dt, this.level.enemies);
    if (combatResult.defeated > 0) {
      this.coins += combatResult.defeated * 2;
      this.toast(`ROBO BUG DEFEATED · +${combatResult.defeated * 2}`);
    }
    for (const item of this.level.collectibles) {
      if (item.collected) continue;
      const dx = Math.abs(body.x - item.x);
      const dy = Math.abs(body.y + body.height * 0.55 - item.y);
      if (dx < 0.82 && dy < 1.2) this.collect(item);
    }

    for (const enemy of this.level.enemies) {
      if (!enemy.alive || !enemy.attackPulse) continue;
      if (Math.abs(body.x - enemy.x) < 1.5 && body.y < 1.05) {
        this.damageHero();
      }
    }

    if (!this.level.checkpointActivated && body.x >= this.level.checkpointX) {
      this.level.checkpointActivated = true;
      this.checkpointX = this.level.checkpointX;
      writeCheckpoint(this.checkpointX, this.levelNumber);
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
      if (this.shards > 0) this.completeLevel();
      else {
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

    const targetX = Math.max(-4, Math.min(30, this.hero.body.x + 1.5));
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
    this.ui.heroSwitch.removeEventListener('click', this.onHeroSwitch);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.projectiles.destroy();
    this.hero.destroy();
    this.level.destroy();
    this.renderer.dispose();
    this.mount.replaceChildren();
  }
}
