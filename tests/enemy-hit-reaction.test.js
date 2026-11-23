import test from 'node:test';
import assert from 'node:assert/strict';
import { applyEnemyHit, stepEnemyHitReaction } from '../src/adventure/EnemyHitReaction.js';
import { createEnemyState, stepEnemy } from '../src/adventure/EnemyAI.js';
import { initializeBoss, stepBoss } from '../src/adventure/BossAI.js';
import { getEnemyVisualState } from '../src/adventure/EnemyEffects.js';

function target(overrides = {}) {
  return {
    x: 0, minX: -2, maxX: 2, health: 3, alive: true,
    hurtTimer: 0, knockbackVelocity: 0, direction: 1,
    state: 'patrol', attackPulse: false, ...overrides,
  };
}

test('shared hit response applies damage, bounded knockback and a short stun', () => {
  const enemy = target();
  const result = applyEnemyHit(enemy, { damage: 1, knockback: 4, direction: 1, stunDuration: 0.2 });
  assert.deepEqual(result, { hit: true, defeated: false });
  assert.equal(enemy.health, 2);
  assert.equal(enemy.hurtTimer, 0.2);
  assert.equal(enemy.knockbackVelocity, 4);
  assert.equal(enemy.hitFlashTimer, 0.14);
});

test('an already stunned enemy cannot be hit repeatedly', () => {
  const enemy = target({ hurtTimer: 0.1 });
  const result = applyEnemyHit(enemy, { damage: 2 });
  assert.equal(result.hit, false);
  assert.equal(enemy.health, 3);
});

test('hit reaction moves within route bounds and decays knockback', () => {
  const enemy = target({ x: 1.9, knockbackVelocity: 8, hurtTimer: 0.2 });
  assert.equal(stepEnemyHitReaction(enemy, 1 / 60), true);
  assert.equal(enemy.x, 2);
  assert.ok(enemy.knockbackVelocity < 8);
  assert.equal(stepEnemyHitReaction(enemy, 0.3), false);
  assert.equal(enemy.hurtTimer, 0);
});

test('lethal hit marks an enemy defeated and hides its visual group', () => {
  const enemy = target({ health: 1, group: { visible: true } });
  const result = applyEnemyHit(enemy, { damage: 1 });
  assert.equal(result.defeated, true);
  assert.equal(enemy.alive, false);
  assert.equal(enemy.state, 'dead');
  assert.equal(enemy.group.visible, false);
});

test('regular enemy AI pauses attacks while hurt-stunned', () => {
  const enemy = createEnemyState(0, -4, 4, 1);
  enemy.hurtTimer = 0.2;
  enemy.knockbackVelocity = -3;
  enemy.attackCooldown = 0;
  stepEnemy(enemy, { x: 0.5, y: 0 }, 1 / 60);
  assert.equal(enemy.state, 'hurt');
  assert.equal(enemy.attackPulse, false);
  assert.ok(enemy.x < 0);
});

test('boss telegraph is interrupted by a hit reaction', () => {
  const boss = initializeBoss({
    x: 0, minX: -5, maxX: 5, health: 12, maxHealth: 12,
    bossName: 'Neighborhood Guardian', isBoss: true, alive: true,
    hurtTimer: 0.2, knockbackVelocity: -2,
    bossMode: 'telegraph', telegraphTimer: 0.1, recoverTimer: 0,
  });
  stepBoss(boss, { x: 2, y: 0 }, 1 / 60);
  assert.equal(boss.bossMode, 'recover');
  assert.equal(boss.attackPulse, false);
  assert.ok(boss.x < 0);
});

test('hurt visual uses a distinct red impact pulse and recoil pose', () => {
  const visual = getEnemyVisualState({ state: 'hurt', direction: 1 }, 0.5);
  assert.equal(visual.ringVisible, true);
  assert.equal(visual.ringColor, '#ff514f');
  assert.equal(visual.bodyScaleX, 0.78);
  assert.equal(visual.bodyScaleY, 1.12);
});
