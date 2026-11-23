const PHASES = Object.freeze([
  Object.freeze({ phase: 1, healthAbove: 0.66, cooldown: 2.4, telegraph: 0.72, chargeSpeed: 2.1 }),
  Object.freeze({ phase: 2, healthAbove: 0.33, cooldown: 1.8, telegraph: 0.58, chargeSpeed: 3.1 }),
  Object.freeze({ phase: 3, healthAbove: 0, cooldown: 1.25, telegraph: 0.42, chargeSpeed: 4.2 }),
]);

const DEFAULT_ATTACK = Object.freeze({
  type: 'close-strike',
  label: 'CLOSE STRIKE',
  evadeHint: 'MOVE OR JUMP',
  attackRange: 2.6,
  maxHeroY: 1.35,
  triggerRange: 5.8,
  telegraphScale: 1,
  cooldownScale: 1,
  approachScale: 1,
  warningColor: '#fff15e',
});

import { stepEnemyHitReaction } from './EnemyHitReaction.js';

const BOSS_ATTACKS = Object.freeze({
  'Neighborhood Guardian': Object.freeze({
    type: 'ground-slam',
    label: 'GROUND SLAM',
    evadeHint: 'JUMP TO EVADE',
    attackRange: 3.5,
    maxHeroY: 0.78,
    triggerRange: 6.8,
    telegraphScale: 1.15,
    cooldownScale: 1.05,
    approachScale: 0.85,
    warningColor: '#ff9957',
  }),
  'Mechanical Headmaster': Object.freeze({
    type: 'gear-dash',
    label: 'GEAR DASH',
    evadeHint: 'MOVE CLEAR',
    attackRange: 2.0,
    maxHeroY: 1.95,
    triggerRange: 8,
    telegraphScale: 0.68,
    cooldownScale: 0.82,
    approachScale: 1.45,
    warningColor: '#ffe36e',
  }),
  'Toy Forest Guardian': Object.freeze({
    type: 'vine-sweep',
    label: 'VINE SWEEP',
    evadeHint: 'JUMP TO AVOID',
    attackRange: 3.7,
    maxHeroY: 2.65,
    triggerRange: 7,
    telegraphScale: 1.08,
    cooldownScale: 1,
    approachScale: 0.9,
    warningColor: '#8ee68b',
  }),
  'Supreme Machine': Object.freeze({
    type: 'pulse-blast',
    label: 'PULSE BLAST',
    evadeHint: 'ESCAPE THE RADIUS',
    attackRange: 4.7,
    maxHeroY: 1.5,
    triggerRange: 8.5,
    telegraphScale: 1.18,
    cooldownScale: 1.15,
    approachScale: 1.05,
    warningColor: '#7be9ff',
  }),
  'Ultimate Time Guardian': Object.freeze({
    type: 'time-wave',
    label: 'TIME WAVE',
    evadeHint: 'JUMP OVER THE WAVE',
    attackRange: 5.2,
    maxHeroY: 0.88,
    triggerRange: 9,
    telegraphScale: 1.05,
    cooldownScale: 0.85,
    approachScale: 1.2,
    warningColor: '#d7a0ff',
  }),
});

export function getBossAttackProfile(bossName) {
  return BOSS_ATTACKS[bossName] || DEFAULT_ATTACK;
}

export function getBossPhase(boss) {
  const ratio = boss.maxHealth > 0 ? boss.health / boss.maxHealth : 0;
  return PHASES.find(item => ratio > item.healthAbove) || PHASES[2];
}

export function initializeBoss(boss) {
  boss.maxHealth = Number.isFinite(boss.maxHealth) && boss.maxHealth > 0 ? boss.maxHealth : 12;
  boss.health = Number.isFinite(boss.health) ? Math.max(0, Math.min(boss.maxHealth, boss.health)) : boss.maxHealth;
  boss.phase = getBossPhase(boss).phase;
  boss.attackProfile = getBossAttackProfile(boss.bossName);
  boss.attackType = boss.attackProfile.type;
  boss.attackLabel = boss.attackProfile.label;
  boss.attackRange = boss.attackProfile.attackRange;
  boss.attackHeight = boss.attackProfile.maxHeroY;
  boss.evadeHint = boss.attackProfile.evadeHint;
  boss.bossMode = 'approach';
  boss.telegraphTimer = 0;
  boss.recoverTimer = 0;
  boss.attackCooldown = Math.max(0, Number(boss.attackCooldown) || 0);
  boss.attackPulse = false;
  boss.alive = boss.alive !== false && boss.health > 0;
  return boss;
}

/** Three-phase boss loop with a boss-specific, telegraphed attack envelope. */
export function stepBoss(boss, hero, dt) {
  if (!(dt > 0) || dt > 0.05) throw new RangeError('Boss dt must be between 0 and 0.05 seconds');
  boss.attackPulse = false;
  if (!boss.alive || boss.health <= 0) {
    boss.alive = false;
    boss.state = 'dead';
    boss.bossMode = 'defeated';
    return;
  }

  const config = getBossPhase(boss);
  const profile = boss.attackProfile || getBossAttackProfile(boss.bossName);
  boss.attackProfile = profile;
  boss.attackType = profile.type;
  boss.attackLabel = profile.label;
  boss.attackRange = profile.attackRange;
  boss.attackHeight = profile.maxHeroY;
  boss.evadeHint = profile.evadeHint;
  boss.phase = config.phase;
  boss.attackCooldown = Math.max(0, boss.attackCooldown - dt);
  if (stepEnemyHitReaction(boss, dt)) {
    boss.bossMode = 'recover';
    boss.recoverTimer = Math.max(boss.recoverTimer, 0.12);
    return;
  }
  boss.telegraphTimer = Math.max(0, boss.telegraphTimer - dt);
  boss.recoverTimer = Math.max(0, boss.recoverTimer - dt);
  const dx = hero.x - boss.x;
  const distance = Math.abs(dx);
  const heroHeight = Math.max(0, hero.y || 0);
  boss.direction = dx < 0 ? -1 : 1;
  boss.state = 'boss';

  if (boss.bossMode === 'telegraph') {
    if (boss.telegraphTimer <= 0) {
      boss.bossMode = 'strike';
      boss.attackPulse = distance <= profile.attackRange && heroHeight <= profile.maxHeroY;
      boss.recoverTimer = 0.62;
    }
    return;
  }

  if (boss.bossMode === 'strike') {
    boss.bossMode = 'recover';
    return;
  }

  if (boss.bossMode === 'recover') {
    if (boss.recoverTimer <= 0) boss.bossMode = 'approach';
    return;
  }

  if (distance > 2.1) {
    boss.x += boss.direction * Math.min(config.chargeSpeed * 0.55 * profile.approachScale, distance - 1.8) * dt;
    boss.x = Math.max(boss.minX, Math.min(boss.maxX, boss.x));
  }
  if (boss.attackCooldown <= 0 && distance <= profile.triggerRange) {
    boss.bossMode = 'telegraph';
    boss.telegraphTimer = config.telegraph * profile.telegraphScale;
    boss.attackCooldown = config.cooldown * profile.cooldownScale;
  }
}
