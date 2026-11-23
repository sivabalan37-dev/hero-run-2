/** Shared, deterministic hit response for regular enemies and bosses. */
export function applyEnemyHit(enemy, {
  damage = 1,
  knockback = 0,
  direction = 1,
  stunDuration = 0.18,
} = {}) {
  if (!enemy?.alive || enemy.hurtTimer > 0) {
    return { hit: false, defeated: false };
  }

  enemy.health = Math.max(0, enemy.health - Math.max(0, damage));
  enemy.hurtTimer = Math.max(0, stunDuration);
  enemy.hitFlashTimer = 0.14;
  enemy.knockbackVelocity = Math.sign(direction || 1) * Math.max(0, knockback);
  enemy.attackPulse = false;

  const defeated = enemy.health <= 0;
  if (defeated) {
    enemy.alive = false;
    enemy.state = 'dead';
    enemy.bossMode = enemy.isBoss ? 'defeated' : enemy.bossMode;
    if (enemy.group) enemy.group.visible = false;
  }
  return { hit: true, defeated };
}

/** Apply bounded knockback while hit-stunned; returns true while AI is interrupted. */
export function stepEnemyHitReaction(enemy, dt) {
  enemy.hitFlashTimer = Math.max(0, (enemy.hitFlashTimer || 0) - dt);
  if (!(enemy.hurtTimer > 0)) return false;

  enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);
  const velocity = Number.isFinite(enemy.knockbackVelocity) ? enemy.knockbackVelocity : 0;
  const minX = Number.isFinite(enemy.minX) ? enemy.minX : enemy.x - 3;
  const maxX = Number.isFinite(enemy.maxX) ? enemy.maxX : enemy.x + 3;
  enemy.x = Math.max(minX, Math.min(maxX, enemy.x + velocity * dt));
  enemy.knockbackVelocity = velocity * Math.exp(-12 * dt);
  return enemy.hurtTimer > 0;
}
