import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnemyState, getEnemyProfile, stepEnemy } from '../src/adventure/EnemyAI.js';

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

test('world enemy profiles provide five distinct combat identities', () => {
  const types = ['robo-bug', 'clockwork-charger', 'vine-sweeper', 'drone-scout', 'time-sentinel'];
  const profiles = types.map(getEnemyProfile);
  assert.equal(new Set(profiles.map(profile => profile.label)).size, 5);
  assert.equal(new Set(profiles.map(profile => profile.style)).size, 5);
  assert.ok(profiles.every(profile => profile.attackRange > 0 && profile.attackHeight > 0));
});

test('Clockwork Charger telegraphs before a dash and only hits at close range', () => {
  const enemy = createEnemyState(0, -8, 8, 1.7, 'clockwork-charger');
  enemy.attackCooldown = 0;
  stepEnemy(enemy, { x: 4, y: 0 }, 1 / 60);
  assert.equal(enemy.state, 'telegraph');
  assert.equal(enemy.attackPulse, false);
  for (let i = 0; i < 32; i++) stepEnemy(enemy, { x: 4, y: 0 }, 1 / 60);
  assert.equal(enemy.state, 'charge');
  for (let i = 0; i < 30; i++) stepEnemy(enemy, { x: 4, y: 0 }, 1 / 60);
  assert.ok(enemy.x > 0);
  assert.equal(enemy.state, 'recover');
});

test('Vine Sweeper has a wider ground sweep but cannot hit above its lane', () => {
  const enemy = createEnemyState(0, -6, 6, 1.15, 'vine-sweeper');
  enemy.attackCooldown = 0;
  stepEnemy(enemy, { x: 2.4, y: 0 }, 1 / 60);
  assert.equal(enemy.state, 'telegraph');
  for (let i = 0; i < 42; i++) stepEnemy(enemy, { x: 2.4, y: 0 }, 1 / 60);
  assert.equal(enemy.attackPulse, true);
  enemy.state = 'chase';
  enemy.attackCooldown = 0;
  stepEnemy(enemy, { x: 2.4, y: 3.2 }, 1 / 60);
  assert.equal(enemy.attackPulse, false);
});

test('Drone Scout can threaten a higher jump lane than ground enemies', () => {
  const enemy = createEnemyState(0, -6, 6, 2.15, 'drone-scout');
  enemy.attackCooldown = 0;
  stepEnemy(enemy, { x: 2.1, y: 2.6 }, 1 / 60);
  assert.equal(enemy.state, 'telegraph');
  for (let i = 0; i < 50; i++) stepEnemy(enemy, { x: 2.1, y: 2.6 }, 1 / 60);
  assert.equal(enemy.attackPulse, true);
});

test('defeated enemies cannot attack', () => {
  const enemy = createEnemyState(0, -4, 4);
  enemy.alive = false;
  stepEnemy(enemy, { x: 0, y: 0 }, 1 / 60);
  assert.equal(enemy.state, 'dead');
  assert.equal(enemy.attackPulse, false);
});
