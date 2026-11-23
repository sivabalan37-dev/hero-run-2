import test from 'node:test';
import assert from 'node:assert/strict';
import { getBenjiFormTransitionVisualState } from '../src/adventure/BenjiFormTransition.js';

test('Benji form transition starts with a small visible energy ring', () => {
  const state = getBenjiFormTransitionVisualState(0);
  assert.equal(state.progress, 0);
  assert.equal(state.active, true);
  assert.ok(state.ringScale < 1);
  assert.equal(state.ringOpacity, 0);
});

test('Benji form transition peaks midway and fades smoothly', () => {
  const middle = getBenjiFormTransitionVisualState(0.28);
  const late = getBenjiFormTransitionVisualState(0.5);
  assert.ok(middle.ringOpacity > late.ringOpacity);
  assert.ok(middle.pulse > late.pulse);
  assert.ok(middle.auraOpacity > 0.3);
});

test('Benji form transition finishes at bounded final values', () => {
  const state = getBenjiFormTransitionVisualState(2);
  assert.equal(state.progress, 1);
  assert.equal(state.active, false);
  assert.equal(state.ringScale, 2.2);
  assert.equal(state.ringOpacity, 0);
  assert.equal(state.pulse, 0);
});

test('Benji form transition handles invalid elapsed time and duration', () => {
  const state = getBenjiFormTransitionVisualState(Number.NaN, 0);
  assert.equal(state.progress, 0);
  assert.equal(state.active, true);
});
