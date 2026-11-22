import * as THREE from 'three';
import { Input } from './Input.js';
import { Player } from './Player.js';
import { World } from './World.js';
import { Effects } from './Effects.js';
import { AudioManager } from './Audio.js';
import { ScoreSystem, loadNumber, saveNumber } from './ScoreSystem.js';

export class Game {
  constructor({ mount, hud }) {
    this.mount = mount; this.hud = hud;
    this.state = 'menu';
    this.elapsed = 0; this.speed = 8; this.baseSpeed = 8; this.distanceOrigin = 4;
    this.best = loadNumber('hero-run-2-best-distance', 0);
    this.totalCoins = loadNumber('hero-run-2-total-coins', 0);
    this.totalShards = loadNumber('hero-run-2-total-shards', 0);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#efb18f');
    this.scene.fog = new THREE.Fog('#efb18f', 42, 178);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 380);
    this.camera.position.set(0, 6.8, 12.2);
    this.camera.lookAt(0, 1.25, -10);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.setClearColor('#efb18f', 1);
    this.mount.appendChild(this.renderer.domElement);
    this.addLights();
    this.world = new World(this.scene);
    this.player = new Player(this.scene);
    this.effects = new Effects(this.scene);
    this.input = new Input(document);
    this.score = new ScoreSystem();
    this.audio = new AudioManager();
    this.clock = new THREE.Clock();
    this.onResize = () => this.resize();
    this.onPause = () => { if (document.hidden && this.state === 'running') this.pause(); };
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onPause);
    this.resize();
    this.hud.showMenu({ best: this.best });
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  addLights() {
    const hemi = new THREE.HemisphereLight('#dff5ff', '#24384b', 1.75);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight('#fff0d6', 3.7);
    sun.position.set(-15, 23, 13);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -19; sun.shadow.camera.right = 19;
    sun.shadow.camera.top = 24; sun.shadow.camera.bottom = -15;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 70;
    sun.shadow.bias = -0.00018;
    sun.shadow.normalBias = 0.035;
    sun.shadow.radius = 4;
    this.scene.add(sun);

    const coolFill = new THREE.DirectionalLight('#65dfff', 0.7);
    coolFill.position.set(11, 8, -16);
    this.scene.add(coolFill);

    const sunsetRim = new THREE.DirectionalLight('#ff936e', 0.95);
    sunsetRim.position.set(-7, 8, -22);
    this.scene.add(sunsetRim);
  }

  resize() {
    const width = Math.max(1, this.mount.clientWidth); const height = Math.max(1, this.mount.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
  }

  async start() {
    try { await this.audio.resume(); } catch { /* Gameplay remains available without sound. */ }
    this.resetRun();
    this.state = 'running'; this.hud.hideMenu(); this.hud.update(this.player, this.score);
  }

  resetRun() {
    this.input.clear();
    this.player.destroy();
    this.world.destroy();
    this.effects.destroy();
    // Rebuild scene gameplay props so each new run starts with a clean field.
    this.world = new World(this.scene);
    this.player = new Player(this.scene);
    this.effects = new Effects(this.scene);
    this.score.reset(); this.elapsed = 0; this.speed = this.baseSpeed;
    this.distanceOrigin = this.player.group.position.z;
    this.camera.position.set(0, 6.5, 11.5);
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused'; this.input.clear(); this.hud.setPaused(true);
    this.hud.showMenu({ title: 'Your run is paused. Continue when you are ready.', button: 'RESUME RUN', best: this.best, status: 'Paused' });
  }
  resume() {
    if (this.state !== 'paused') return;
    this.state = 'running'; this.hud.hideMenu(); this.hud.setPaused(false); this.clock.getDelta();
  }

  endRun() {
    this.state = 'gameover';
    this.best = Math.max(this.best, this.score.distance);
    saveNumber('hero-run-2-best-distance', this.best);
    saveNumber('hero-run-2-total-coins', this.totalCoins);
    saveNumber('hero-run-2-total-shards', this.totalShards);
    this.hud.setPaused(false);
    this.hud.showMenu({
      title: `Run over. You travelled ${this.score.distance} m, scored ${this.score.score} points and defeated ${this.score.kills} enemies.`,
      button: 'RUN AGAIN', best: this.best, status: `This run: ${this.score.coins} coins · ${this.score.shards} shards`
    });
  }

  collect(item) {
    item.taken = true;
    const position = item.group.position.clone();
    if (item.type === 'coin') { this.score.addCoin(); this.totalCoins++; this.audio.coin(); this.effects.burst(position, '#ffd45a', 8); }
    else if (item.type === 'shard') { this.score.addShard(); this.totalShards++; this.audio.power(); this.effects.burst(position, '#51e5ff', 13); }
    else if (item.type === 'health') { this.player.heal(25); this.audio.power(); this.effects.burst(position, '#fa6670', 10); this.hud.toast('+25 HEALTH'); }
    else { this.player.activate(item.type); this.audio.power(); this.effects.burst(position, '#91f3ff', 12); this.hud.toast(`${item.type.toUpperCase()} BOOST`); }
    this.world.group.remove(item.group);
  }

  doCombat() {
    const player = this.player;
    const px = player.group.position.x; const pz = player.group.position.z;
    for (const enemy of this.world.obstacles) {
      if (enemy.type !== 'enemy' || enemy.defeated) continue;
      const dz = pz - enemy.group.position.z;
      const dx = Math.abs(px - enemy.group.position.x);
      const inFront = dz >= 0 && dz < 10.5 && dx < 1.25;
      if (player.attackPulse && inFront) enemy.health -= 25;
      if (player.specialPulse && dz >= -1 && dz < 18 && dx < 3.6) enemy.health -= 50;
      if (enemy.health <= 0) {
        enemy.defeated = true; this.score.addKill();
        this.effects.burst(enemy.group.position.clone().add(new THREE.Vector3(0, 1, 0)), '#ff8159', 18);
        this.audio.hit();
      }
    }
    if (player.attackPulse) this.audio.hit();
    if (player.specialPulse) { this.audio.power(); this.effects.burst(player.group.position.clone().add(new THREE.Vector3(0, 1.5, -4)), '#67e6ff', 24); }
  }

  collisions() {
    const player = this.player; const p = player.group.position;
    for (const item of this.world.collectibles) {
      if (item.taken) continue;
      const dx = Math.abs(p.x - item.group.position.x);
      const dz = Math.abs(p.z - item.group.position.z);
      const magnet = player.magnetTimer > 0 && dx < 5.8;
      if (dz < 1.15 && (dx < 1.18 || magnet) && p.y + 2.35 > item.group.position.y && p.y < item.group.position.y + 1.3) this.collect(item);
    }
    for (const obstacle of this.world.obstacles) {
      if (obstacle.defeated) continue;
      const dz = Math.abs(p.z - obstacle.group.position.z);
      const dx = Math.abs(p.x - obstacle.group.position.x);
      if (dz > 0.9 || dx > 1.1) continue;
      if (obstacle.type === 'enemy') {
        if (player.damage(18)) { this.audio.hit(); this.hud.toast('HIT!'); }
      } else {
        const clears = obstacle.type === 'spikes' ? p.y > 0.88 : p.y > 1.25;
        if (!clears && player.slideTimer <= 0) {
          if (player.damage(20)) { this.audio.hit(); this.hud.toast('OBSTACLE HIT'); }
        }
      }
    }
  }

  update(dt) {
    this.elapsed += dt;
    const boost = this.player.speedTimer > 0 ? 1.45 : 1;
    this.speed = Math.min(17, this.baseSpeed + this.elapsed * 0.07) * boost;
    this.player.update(dt, this.input, this.speed);
    this.player.group.position.z -= this.speed * dt;
    this.world.update(dt, this.player.group.position.z, this.speed);
    this.doCombat(); this.collisions();
    this.score.updateDistance(-this.player.group.position.z + this.distanceOrigin);
    this.effects.update(dt);
    const cameraTarget = new THREE.Vector3(this.player.group.position.x * 0.35, 6.1 + this.player.group.position.y * 0.12, this.player.group.position.z + 10.5);
    this.camera.position.lerp(cameraTarget, 1 - Math.exp(-dt * 3.8));
    this.camera.lookAt(this.player.group.position.x * 0.18, 1.05 + this.player.group.position.y * 0.15, this.player.group.position.z - 8.5);
    this.hud.update(this.player, this.score);
    if (this.player.health <= 0) this.endRun();
  }

  loop() {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.04);
    if (this.state === 'running') this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.input.endFrame();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onPause);
    this.input.destroy(); this.renderer.dispose();
    this.mount.replaceChildren();
  }
}
