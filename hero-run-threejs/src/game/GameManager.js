import { Engine } from '../core/Engine.js';
import { InputManager } from '../core/InputManager.js';
import { AudioManager } from '../core/AudioManager.js';
import { LevelGenerator } from './LevelGenerator.js';
import { PlayerController } from './PlayerController.js';
import { CameraController } from './CameraController.js';
import { ObstacleManager } from './ObstacleManager.js';
import { CoinManager } from './CoinManager.js';
import { PowerUpManager } from './PowerUpManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { ScoreManager } from './ScoreManager.js';
import { DifficultyManager } from './DifficultyManager.js';
import { SaveManager } from './SaveManager.js';
import { Effects } from './Effects.js';
import { HEROES, CONFIG } from '../config/gameConfig.js';

export class GameManager {
  constructor({ mount, ui }) {
    this.ui = ui; this.engine = new Engine(mount); this.scene = this.engine.scene; this.camera = new CameraController(this.engine.camera);
    this.input = new InputManager(); this.audio = new AudioManager(); this.save = new SaveManager();
    this.world = new LevelGenerator(this.scene); this.score = new ScoreManager(); this.difficulty = new DifficultyManager();
    this.obstacles = new ObstacleManager(this.scene); this.coins = new CoinManager(this.scene); this.powerups = new PowerUpManager(this.scene);
    this.collisions = new CollisionSystem(); this.effects = new Effects(this.scene);
    this.heroKey = this.save.getText('hero', 'shin'); this.player = new PlayerController(this.scene, this.heroKey);
    this.state = 'menu'; this.elapsed = 0; this.best = this.save.getNumber('best-distance', 0);
    this.raf = 0; this.last = performance.now();
    this.onVisibility = () => { if (document.hidden && this.state === 'running') this.pause(); };
    document.addEventListener('visibilitychange', this.onVisibility);
    this.loop = this.loop.bind(this); this.raf = requestAnimationFrame(this.loop);
    this.ui.setAvatar(HEROES[this.heroKey].avatar); this.ui.showMenu(this.best);
  }
  async start() {
    await this.audio.resume(); this.resetRun(); this.state = 'running'; this.ui.showHUD(); this.input.clear(); this.last = performance.now();
  }
  resetRun() {
    this.player.destroy(); this.player = new PlayerController(this.scene, this.heroKey);
    this.score.reset(); this.difficulty.reset(); this.obstacles.reset(); this.coins.reset(); this.powerups.reset(); this.effects.clear();
    this.elapsed = 0; this.engine.time.reset(); this.ui.setAvatar(HEROES[this.heroKey].avatar);
  }
  pause() { if (this.state !== 'running') return; this.state = 'paused'; this.input.clear(); this.ui.showPause(); }
  resume() { if (this.state !== 'paused') return; this.state = 'running'; this.ui.hidePause(); this.last = performance.now(); }
  async restart() { await this.start(); }
  home() { this.state = 'menu'; this.input.clear(); this.ui.showMenu(this.best); }
  chooseHero(key) {
    if (!HEROES[key]) return; this.heroKey = key; this.save.setText('hero', key); this.ui.setAvatar(HEROES[key].avatar);
    if (this.state === 'menu') { this.player.changeHero(key); }
  }
  setSound(value) { this.audio.setSound(value); }
  setMusic(value) { this.audio.setMusic(value); }
  setQuality(value) { this.engine.setQuality(value); }
  async fullscreen() {
    try {
      if (!document.fullscreenElement) await document.querySelector('#game-root').requestFullscreen();
      else await document.exitFullscreen();
    } catch { this.ui.toast('Fullscreen is not available here'); }
  }
  update(dt) {
    this.elapsed += dt;
    const rawSpeed = this.difficulty.update(dt);
    const speed = rawSpeed * (this.player.boostTimer > 0 ? 1.35 : 1);
    this.player.update(dt, this.input);
    this.world.update(dt, speed, this.elapsed);
    this.obstacles.update(dt, speed, this.elapsed, this.difficulty);
    this.coins.update(dt, speed, this.elapsed, this.difficulty);
    this.powerups.update(dt, speed, this.elapsed);
    this.collisions.check(this.player, this.obstacles, this.coins, this.powerups, this.score, (type, data) => this.onCollision(type, data));
    this.score.updateDistance(speed * dt);
    this.effects.update(dt); this.camera.update(dt, this.player);
    this.ui.update(this.player, this.score, this.elapsed);
    if (this.player.health <= 0) this.endRun();
  }
  onCollision(type, data) {
    if (type === 'coin') { this.audio.coin(); this.effects.burst(this.player.group.position.clone().add({x:0,y:1.4,z:0}), '#ffd44d', 5); }
    if (type === 'shard') { this.audio.power(); this.effects.burst(this.player.group.position.clone().add({x:0,y:1.6,z:0}), '#55e8ff', 12); this.ui.toast('+1 TIME SHARD'); }
    if (type === 'health') { this.audio.power(); this.ui.toast('+1 HEART'); }
    if (type === 'power') { this.audio.power(); this.ui.toast(String(data).toUpperCase() + ' BOOST'); }
    if (type === 'enemy') { this.audio.power(); this.effects.burst(data, '#7cf277', 18); this.ui.toast('MAGIC HIT!'); }
    if (type === 'hit') { this.audio.hit(); this.ui.toast('WATCH OUT!'); }
    if (type === 'clear') this.effects.burst(this.player.group.position.clone().add({x:0,y:0.8,z:0}), '#b7f17b', 6);
  }
  endRun() {
    if (this.state !== 'running') return;
    this.state = 'gameover'; this.input.clear();
    this.best = Math.max(this.best, Math.floor(this.score.distance));
    this.save.setNumber('best-distance', this.best);
    this.save.setNumber('total-coins', this.save.getNumber('total-coins', 0) + this.score.coins);
    this.ui.showGameOver(this.score, this.best);
  }
  loop(now) {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min((now - this.last) / 1000, 0.04); this.last = now;
    if (this.state === 'running') {
      if (this.input.consume('pause')) this.pause();
      else this.update(dt);
    }
    this.engine.render(); this.input.endFrame();
  }
  dispose() {
    cancelAnimationFrame(this.raf); document.removeEventListener('visibilitychange', this.onVisibility);
    this.input.dispose(); this.audio.dispose(); this.effects.clear(); this.player.destroy(); this.world.dispose();
    this.obstacles.clear(); this.coins.clear(); this.powerups.clear(); this.engine.dispose();
  }
}