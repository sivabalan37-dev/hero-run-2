import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnemyState, stepEnemy } from '../src/adventure/EnemyAI.js';

test('Robo Bug patrols within its defined route', () => {
  const enemy = createEnemyState(0, -1, 1, 2);
  for (let i = 0; i < 120; i++) stepEnemy(enemy, { x: 20, y: 0 }, 1 / 60);
  assert.ok(enemy.x >= -1 && enemy.x <= 1);
  assert.equal(enemy.state, 'patrol');
});

test('Robo Bug changes to chase when Shin enters detection range', () => {
  const enemy = createEnemyState(0, -4, 4);
  stepEnemy(enemy, { x: 3, y: 0 }, 1 / 60);
  assert.equal(enemy.state, 'chase');
  assert.ok(enemy.x > 0);
});

test('Robo Bug attack pulse respects attack cooldown', () => {
  const enemy = createEnemyState(0, -4, 4, 1);
  enemy.attackCooldown = 0;
  stepEnemy(enemy, { x: 1, y: 0 }, 1 / 60);
  assert.equal(enemy.state, 'attack');
  assert.equal(enemy.attackPulse, true);
  stepEnemy(enemy, { x: 1, y: 0 }, 1 / 60);
  assert.equal(enemy.attackPulse, false);
});

test('Robo Bug does not attack when the player is vertically out of reach', () => {
  const enemy = createEnemyState(0, -4, 4);
  enemy.attackCooldown = 0;
  stepEnemy(enemy, { x: 0.5, y: 5 }, 1 / 60);
  assert.equal(enemy.attackPulse, false);
  assert.equal(enemy.state, 'patrol');
});
