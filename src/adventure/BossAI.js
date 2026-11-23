const PHASES = Object.freeze([
  Object.freeze({ phase: 1, healthAbove: 0.66, cooldown: 2.4, telegraph: 0.72, chargeSpeed: 2.1 }),
  Object.freeze({ phase: 2, healthAbove: 0.33, cooldown: 1.8, telegraph: 0.58, chargeSpeed: 3.1 }),
  Object.freeze({ phase: 3, healthAbove: 0, cooldown: 1.25, telegraph: 0.42, chargeSpeed: 4.2 }),
]);

export function getBossPhase(boss) {
  const ratio = boss.maxHealth > 0 ? boss.health / boss.maxHealth : 0;
  return PHASES.find(item => ratio > item.healthAbove) || PHASES[2];
}

export function initializeBoss(boss) {
  boss.maxHealth = Number.isFinite(boss.maxHealth) && boss.maxHealth > 0 ? boss.maxHealth : 12;
  boss.health = Number.isFinite(boss.health) ? Math.max(0, Math.min(boss.maxHealth, boss.health)) : boss.maxHealth;
  boss.phase = getBossPhase(boss).phase;
  boss.bossMode = 'approach';
  boss.telegraphTimer = 0;
  boss.recoverTimer = 0;
  boss.attackCooldown = Math.max(0, Number(boss.attackCooldown) || 0);
  boss.attackPulse = false;
  boss.alive = boss.alive !== false && boss.health > 0;
  return boss;
}

/** Three-phase boss loop: telegraph, charge strike, then recovery. */
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
  boss.phase = config.phase;
  boss.attackCooldown = Math.max(0, boss.attackCooldown - dt);
  boss.hurtTimer = Math.max(0, (boss.hurtTimer || 0) - dt);
  boss.telegraphTimer = Math.max(0, boss.telegraphTimer - dt);
  boss.recoverTimer = Math.max(0, boss.recoverTimer - dt);
  const dx = hero.x - boss.x;
  const distance = Math.abs(dx);
  boss.direction = dx < 0 ? -1 : 1;
  boss.state = 'boss';

  if (boss.bossMode === 'telegraph') {
    if (boss.telegraphTimer <= 0) {
      boss.bossMode = 'strike';
      boss.attackPulse = distance <= 2.6 && Math.max(0, hero.y || 0) <= 1.35;
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
    boss.x += boss.direction * Math.min(config.chargeSpeed * 0.55, distance - 1.8) * dt;
    boss.x = Math.max(boss.minX, Math.min(boss.maxX, boss.x));
  }
  if (boss.attackCooldown <= 0 && distance <= 5.8) {
    boss.bossMode = 'telegraph';
    boss.telegraphTimer = config.telegraph;
    boss.attackCooldown = config.cooldown;
  }
}
