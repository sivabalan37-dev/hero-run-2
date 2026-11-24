import { applyEnemyHit } from './EnemyHitReaction.js';

export const BENJI_FORM_CONFIG = Object.freeze({
  normal: Object.freeze({
    movement: Object.freeze({ moveSpeed: 7.2, acceleration: 42, jumpSpeed: 10.8 }),
    damageMultiplier: 1,
    specialCooldown: 4.2,
    specialLabel: 'BURST',
    specialType: 'star-burst',
  }),
  blaze: Object.freeze({
    movement: Object.freeze({ moveSpeed: 9.4, acceleration: 52, jumpSpeed: 11 }),
    damageMultiplier: 1,
    specialCooldown: 4.8,
    specialLabel: 'FLAME',
    specialType: 'flame',
  }),
  shock: Object.freeze({
    movement: Object.freeze({ moveSpeed: 7.8, acceleration: 44, jumpSpeed: 12.2 }),
    damageMultiplier: 1,
    specialCooldown: 5.2,
    specialLabel: 'SHOCK',
    specialType: 'shock',
  }),
  titan: Object.freeze({
    movement: Object.freeze({ moveSpeed: 5.4, acceleration: 34, jumpSpeed: 9.8 }),
    damageMultiplier: 0.5,
    specialCooldown: 5.8,
    specialLabel: 'STOMP',
    specialType: 'stomp',
  }),
});

export function getBenjiFormStats(form) {
  return BENJI_FORM_CONFIG[form] || BENJI_FORM_CONFIG.normal;
}

function isWithinShockPulse(body, enemy) {
  const heroCenterY = (Number.isFinite(body.y) ? body.y : 0) + (Number.isFinite(body.height) ? body.height * 0.5 : 0.95);
  const enemyLocalCenterY = enemy.isBoss
    ? 1.815
    : enemy.enemyType === 'drone-scout' ? 1.05 : 0.62;
  const enemyWorldCenterY = enemyLocalCenterY + (Number.isFinite(enemy.group?.position?.y) ? enemy.group.position.y : 0);
  return Math.abs(heroCenterY - enemyWorldCenterY) <= 2.2;
}

function damageEnemy(enemy, damage, knockback = 0, originX = 0) {
  const direction = Math.sign(enemy?.x - originX) || 1;
  return applyEnemyHit(enemy, {
    damage,
    knockback: knockback * 4,
    direction,
    stunDuration: enemy?.isBoss ? 0.28 : 0.24,
  });
}

/**
 * Resolve one of Benji's form-specific special moves.
 * Blaze strikes forward, Shock hits nearby enemies, and Titan stomps only while grounded.
 */
export function applyBenjiSpecial(form, body, enemies = []) {
  if (!body || !Array.isArray(enemies)) {
    throw new TypeError('Benji special requires a body and an enemy array');
  }

  const targets = [];
  let damage = 0;
  let knockback = 0;
  let ability = 'star-burst';

  if (form === 'blaze') {
    ability = 'flame';
    damage = 2;
    knockback = 0.8;
    for (const enemy of enemies) {
      const forwardDistance = (enemy.x - body.x) * (body.facing || 1);
      if (forwardDistance >= 0.65 && forwardDistance <= 6.4 && body.y <= 2.2) {
        targets.push(enemy);
      }
    }
  } else if (form === 'shock') {
    ability = 'shock';
    damage = 2;
    knockback = 0.35;
    for (const enemy of enemies) {
      const distanceX = Math.abs(enemy.x - body.x);
      if (distanceX <= 4.35 && isWithinShockPulse(body, enemy)) targets.push(enemy);
    }
  } else if (form === 'titan') {
    ability = 'stomp';
    if (!body.grounded) {
      return { ready: false, ability, hits: 0, defeated: 0 };
    }
    damage = 3;
    knockback = 1.6;
    for (const enemy of enemies) {
      if (Math.abs(enemy.x - body.x) <= 3.25) targets.push(enemy);
    }
  } else {
    return { ready: true, ability, hits: 0, defeated: 0 };
  }

  let hits = 0;
  let defeated = 0;
  for (const enemy of targets) {
    const result = damageEnemy(enemy, damage, knockback, body.x);
    if (!result.hit) continue;
    hits++;
    if (result.defeated) defeated++;
  }
  return { ready: true, ability, hits, defeated };
}
