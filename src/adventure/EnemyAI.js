export function createEnemyState(x, minX, maxX, speed = 1.45) {
  return {
    x, minX, maxX, speed,
    direction: 1,
    health: 2,
    state: 'patrol',
    attackCooldown: 0.25,
    attackPulse: false,
    hurtTimer: 0,
    alive: true,
  };
}

/** Small deterministic AI state machine for a ground Robo Bug. */
export function stepEnemy(enemy, hero, dt) {
  enemy.attackPulse = false;
  if (!enemy.alive) {
    enemy.state = 'dead';
    return;
  }

  enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
  enemy.hurtTimer = Math.max(0, enemy.hurtTimer - dt);

  const dx = hero.x - enemy.x;
  const dy = Math.abs((hero.y || 0) - 0);
  const distance = Math.abs(dx);

  if (dy > 3.2 || distance > 7.5) {
    enemy.state = 'patrol';
    enemy.x += enemy.direction * enemy.speed * dt;
    if (enemy.x >= enemy.maxX) {
      enemy.x = enemy.maxX;
      enemy.direction = -1;
    } else if (enemy.x <= enemy.minX) {
      enemy.x = enemy.minX;
      enemy.direction = 1;
    }
    return;
  }

  enemy.direction = dx < 0 ? -1 : 1;
  if (distance <= 1.35) {
    enemy.state = 'attack';
    if (enemy.attackCooldown <= 0) {
      enemy.attackPulse = true;
      enemy.attackCooldown = 1.15;
    }
  } else if (distance <= 5.2) {
    enemy.state = 'chase';
    enemy.x += enemy.direction * enemy.speed * 1.55 * dt;
    enemy.x = Math.max(enemy.minX, Math.min(enemy.maxX, enemy.x));
  } else {
    enemy.state = 'alert';
  }
}
