import test from 'node:test';
import assert from 'node:assert/strict';
import { getEnemyVisualState } from '../src/adventure/EnemyEffects.js';

test('telegraph visual pulses with the enemy-specific warning color', () => {
  const state = getEnemyVisualState({
    state: 'telegraph',
    warningColor: '#8ee68b',
  }, 0.4);
  assert.equal(state.ringVisible, true);
  assert.equal(state.ringColor, '#8ee68b');
  assert.ok(state.ringScale > 0.9);
  assert.ok(state.ringOpacity > 0.3);
});

test('charger visual leans forward and compresses during its dash', () => {
  const state = getEnemyVisualState({ state: 'charge' }, 1);
  assert.equal(state.bodyScaleX, 1.18);
  assert.equal(state.bodyScaleY, 0.78);
  assert.ok(state.rotationZ < 0);
  assert.equal(state.ringColor, '#ffffff');
});

test('attack visual produces a short impact ring', () => {
  const state = getEnemyVisualState({ state: 'attack' }, 2);
  assert.equal(state.ringVisible, true);
  assert.equal(state.ringColor, '#fff15e');
  assert.equal(state.bodyScaleY, 0.72);
});

test('boss telegraph uses its attack profile color and boss proportions', () => {
  const state = getEnemyVisualState({
    isBoss: true,
    bossMode: 'telegraph',
    attackProfile: { warningColor: '#d7a0ff' },
  }, 0.7);
  assert.equal(state.ringColor, '#d7a0ff');
  assert.equal(state.ringVisible, true);
  assert.ok(state.bodyScaleY > 1.65);
});

test('idle animation is bounded and has no active attack ring', () => {
  const state = getEnemyVisualState({ state: 'patrol' }, 3.14);
  assert.equal(state.ringVisible, false);
  assert.ok(state.bodyScaleY > 0.9 && state.bodyScaleY < 1.1);
  assert.ok(Math.abs(state.bob) <= 0.05);
});

test('invalid elapsed time safely falls back to zero', () => {
  const state = getEnemyVisualState({ state: 'patrol' }, Number.NaN);
  assert.ok(Number.isFinite(state.bodyScaleY));
  assert.ok(Number.isFinite(state.bob));
});
