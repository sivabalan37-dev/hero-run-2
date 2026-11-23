import test from 'node:test';
import assert from 'node:assert/strict';
import { getGadgetVisionVisualState } from '../src/adventure/GadgetVisionEffects.js';

test('Gadget Vision scan starts as two visible concentric waves', () => {
  const state = getGadgetVisionVisualState(0);
  assert.equal(state.innerScale, 0.35);
  assert.equal(state.outerScale, 0.18);
  assert.equal(state.innerOpacity, 0.88);
  assert.equal(state.outerOpacity, 0.42);
});

test('Gadget Vision waves expand and fade to transparent', () => {
  const state = getGadgetVisionVisualState(1);
  assert.ok(state.innerScale > 5);
  assert.ok(state.outerScale > state.innerScale);
  assert.equal(state.innerOpacity, 0);
  assert.equal(state.outerOpacity, 0);
});

test('Gadget Vision progress is clamped and invalid values are safe', () => {
  assert.deepEqual(getGadgetVisionVisualState(-2), getGadgetVisionVisualState(0));
  assert.deepEqual(getGadgetVisionVisualState(4), getGadgetVisionVisualState(1));
  assert.deepEqual(getGadgetVisionVisualState(Number.NaN), getGadgetVisionVisualState(0));
});
