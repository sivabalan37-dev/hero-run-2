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

function damageEnemy(enemy, damage, knockback = 0, originX = 0) {
  if (!enemy?.alive || enemy.hurtTimer > 0) return { hit: false, defeated: false };

  enemy.health = Math.max(0, enemy.health - damage);
  enemy.hurtTimer = 0.32;
  if (knockback > 0 && Number.isFinite(enemy.x)) {
    const direction = Math.sign(enemy.x - originX) || 1;
    const minX = Number.isFinite(enemy.minX) ? enemy.minX : enemy.x - 2;
    const maxX = Number.isFinite(enemy.maxX) ? enemy.maxX : enemy.x + 2;
    enemy.x = Math.max(minX, Math.min(maxX, enemy.x + direction * knockback));
  }

  const defeated = enemy.health <= 0;
  if (defeated) {
    enemy.alive = false;
    enemy.state = 'dead';
    enemy.attackPulse = false;
    if (enemy.group) enemy.group.visible = false;
  }
  return { hit: true, defeated };
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
      if (distanceX <= 4.35 && body.y <= 2.7) targets.push(enemy);
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
