import { stepEnemyHitReaction } from './EnemyHitReaction.js';

const ENEMY_PROFILES = Object.freeze({
  'robo-bug': Object.freeze({
    label: 'Robo Bug', speed: 1.45, detectionRange: 5.2, disengageRange: 7.5,
    attackRange: 1.35, attackHeight: 1.05, cooldown: 1.15, style: 'contact',
    warningColor: '#fff15e',
  }),
  'clockwork-charger': Object.freeze({
    label: 'Clockwork Charger', speed: 1.7, detectionRange: 7, disengageRange: 9,
    attackRange: 1.25, attackHeight: 1.05, triggerRange: 5.6,
    cooldown: 1.8, telegraph: 0.52, chargeSpeed: 8.5, chargeDuration: 0.34,
    style: 'charge', warningColor: '#ffe36e',
  }),
  'vine-sweeper': Object.freeze({
    label: 'Vine Sweeper', speed: 1.15, detectionRange: 6.2, disengageRange: 8,
    attackRange: 2.85, attackHeight: 1.9, triggerRange: 4.7,
    cooldown: 2.0, telegraph: 0.68, recovery: 0.42,
    style: 'sweep', warningColor: '#8ee68b',
  }),
  'drone-scout': Object.freeze({
    label: 'Drone Scout', speed: 2.15, detectionRange: 7.2, disengageRange: 10,
    attackRange: 2.45, attackHeight: 3.1, triggerRange: 5.8,
    cooldown: 1.65, telegraph: 0.82, recovery: 0.36,
    style: 'pulse', warningColor: '#7be9ff',
  }),
  'time-sentinel': Object.freeze({
    label: 'Time Sentinel', speed: 1.8, detectionRange: 7.5, disengageRange: 10,
    attackRange: 1.8, attackHeight: 1.45, triggerRange: 5.2,
    cooldown: 1.35, telegraph: 0.38, recovery: 0.28,
    style: 'blink', warningColor: '#d7a0ff',
  }),
});

export function getEnemyProfile(type = 'robo-bug') {
  return ENEMY_PROFILES[type] || ENEMY_PROFILES['robo-bug'];
}

export function createEnemyState(x, minX, maxX, speed, type = 'robo-bug') {
  const profile = getEnemyProfile(type);
  return {
    x, minX, maxX,
    speed: Number.isFinite(speed) && speed > 0 ? speed : profile.speed,
    enemyType: ENEMY_PROFILES[type] ? type : 'robo-bug',
    enemyName: profile.label,
    attackRange: profile.attackRange,
    attackHeight: profile.attackHeight,
    warningColor: profile.warningColor,
    direction: 1,
    health: 2,
    state: 'patrol',
    attackCooldown: 0.25,
    attackPulse: false,
    hurtTimer: 0,
    telegraphTimer: 0,
    actionTimer: 0,
    alive: true,
  };
}

function patrol(enemy, dt) {
  enemy.state = 'patrol';
  enemy.x += enemy.direction * enemy.speed * dt;
  if (enemy.x >= enemy.maxX) {
    enemy.x = enemy.maxX;
    enemy.direction = -1;
  } else if (enemy.x <= enemy.minX) {
    enemy.x = enemy.minX;
    enemy.direction = 1;
  }
}

/** Deterministic enemy AI. Hero y is the feet position; attack windows are profile-specific. */
export function stepEnemy(enemy, hero, dt) {
  enemy.attackPulse = false;
  if (!enemy.alive) {
    enemy.state = 'dead';
    return;
  }

  const profile = getEnemyProfile(enemy.enemyType);
  enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
  if (stepEnemyHitReaction(enemy, dt)) {
    enemy.state = 'hurt';
    return;
  }
  const dx = hero.x - enemy.x;
  const distance = Math.abs(dx);
  const heroHeight = Math.max(0, hero.y || 0);
  enemy.direction = dx < 0 ? -1 : 1;

  if (enemy.state === 'telegraph') {
    enemy.telegraphTimer = Math.max(0, enemy.telegraphTimer - dt);
    if (enemy.telegraphTimer <= 0) {
      if (profile.style === 'charge') {
        enemy.state = 'charge';
        enemy.actionTimer = profile.chargeDuration;
      } else {
        enemy.state = 'attack';
        enemy.attackPulse = distance <= profile.attackRange && heroHeight <= profile.attackHeight;
        enemy.actionTimer = profile.recovery;
      }
    }
    return;
  }

  if (enemy.state === 'charge') {
    const step = Math.min(profile.chargeSpeed * dt, Math.max(0, distance - 0.7));
    enemy.x += enemy.direction * step;
    enemy.x = Math.max(enemy.minX, Math.min(enemy.maxX, enemy.x));
    enemy.actionTimer = Math.max(0, enemy.actionTimer - dt);
    const newDistance = Math.abs(hero.x - enemy.x);
    if (!enemy.chargeHit && newDistance <= profile.attackRange && heroHeight <= profile.attackHeight) {
      enemy.attackPulse = true;
      enemy.chargeHit = true;
    }
    if (enemy.actionTimer <= 0) {
      enemy.state = 'recover';
      enemy.actionTimer = 0.48;
      enemy.chargeHit = false;
    }
    return;
  }

  if (enemy.state === 'attack' || enemy.state === 'recover') {
    enemy.actionTimer = Math.max(0, enemy.actionTimer - dt);
    if (enemy.actionTimer <= 0) enemy.state = 'chase';
    return;
  }

  if (heroHeight > profile.attackHeight + 2.1 || distance > profile.disengageRange) {
    patrol(enemy, dt);
    return;
  }

  if (distance <= profile.triggerRange && enemy.attackCooldown <= 0 && profile.style !== 'contact') {
    enemy.state = 'telegraph';
    enemy.telegraphTimer = profile.telegraph;
    enemy.attackCooldown = profile.cooldown;
    enemy.chargeHit = false;
    return;
  }

  if (profile.style === 'contact' && distance <= profile.attackRange && heroHeight <= profile.attackHeight) {
    enemy.state = 'attack';
    if (enemy.attackCooldown <= 0) {
      enemy.attackPulse = true;
      enemy.attackCooldown = profile.cooldown;
    }
  } else if (distance <= profile.detectionRange) {
    enemy.state = 'chase';
    enemy.x += enemy.direction * enemy.speed * 1.55 * dt;
    enemy.x = Math.max(enemy.minX, Math.min(enemy.maxX, enemy.x));
  } else {
    enemy.state = 'alert';
  }
}
