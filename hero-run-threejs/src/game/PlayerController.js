import { LANES, CONFIG, HEROES } from '../config/gameConfig.js';
import { clamp, damp } from '../utils/helpers.js';
import { Player } from '../entities/Player.js';

export class PlayerController {
  constructor(scene, heroKey = 'shin') {
    this.scene = scene; this.heroKey = heroKey; this.player = new Player(scene, HEROES[heroKey]);
    this.group = this.player.group; this.health = CONFIG.maxHealth; this.lane = 1; this.velocityY = 0;
    this.airJumps = 0; this.onGround = true; this.slideTimer = 0; this.invulnerable = 0;
    this.shieldTimer = 0; this.magnetTimer = 0; this.boostTimer = 0;
    this.attackPulse = false; this.specialPulse = false;
  }
  update(dt, input) {
    if (input.consume('left')) this.lane = clamp(this.lane - 1, 0, 2);
    if (input.consume('right')) this.lane = clamp(this.lane + 1, 0, 2);
    this.group.position.x = damp(this.group.position.x, LANES[this.lane], 13, dt);

    if (input.consume('jump') && (this.onGround || this.airJumps < CONFIG.maxAirJumps)) {
      this.velocityY = CONFIG.jumpVelocity;
      if (!this.onGround) this.airJumps += 1;
      this.onGround = false;
    }
    if (input.consume('slide')) this.slideTimer = 0.72;
    this.slideTimer = Math.max(0, this.slideTimer - dt);
    this.velocityY += CONFIG.gravity * dt;
    this.group.position.y += this.velocityY * dt;
    if (this.group.position.y <= 0) {
      this.group.position.y = 0; this.velocityY = 0; this.onGround = true; this.airJumps = 0;
    }

    this.attackPulse = input.consume('attack');
    this.specialPulse = input.consume('special');
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    this.boostTimer = Math.max(0, this.boostTimer - dt);
    const flashing = this.invulnerable > 0 && Math.floor(this.invulnerable * 14) % 2 === 0;
    this.player.setVisible(!flashing);
    this.player.updateAnimation(dt, !this.onGround, this.slideTimer > 0, this.invulnerable > 0, this.shieldTimer > 0);
    return { attack: this.attackPulse, special: this.specialPulse };
  }
  damage() {
    if (this.invulnerable > 0) return false;
    if (this.shieldTimer > 0) { this.shieldTimer = 0; this.invulnerable = 0.5; return true; }
    this.health = Math.max(0, this.health - 1); this.invulnerable = 1.1; return true;
  }
  heal(amount = 1) { this.health = Math.min(CONFIG.maxHealth, this.health + Math.max(0, amount)); }
  activate(type) {
    if (type === 'shield') this.shieldTimer = 8;
    if (type === 'magnet') this.magnetTimer = 8;
    if (type === 'boost') this.boostTimer = 6;
  }
  changeHero(key) { if (!HEROES[key] || key === this.heroKey) return; this.player.dispose(); this.heroKey = key; this.player = new Player(this.scene, HEROES[key]); this.group = this.player.group; this.group.position.x = LANES[this.lane]; }
  destroy() { this.player.dispose(); }
}