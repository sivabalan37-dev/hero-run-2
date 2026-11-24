import test from 'node:test';
import assert from 'node:assert/strict';
import { getBenjiFlameOffset, getBenjiSpecialVisualState } from '../src/adventure/BenjiSpecialEffects.js';

test('Benji flame effect expands forward and fades within its short window', () => {
  const early = getBenjiSpecialVisualState('flame', 0.08);
  const late = getBenjiSpecialVisualState('flame', 0.28);
  assert.ok(late.scale > early.scale);
  assert.ok(late.opacity < early.opacity);
  assert.equal(getBenjiSpecialVisualState('flame', 1).visible, false);
});

test('Benji shock and stomp effects have distinct expansion profiles', () => {
  const shock = getBenjiSpecialVisualState('shock', 0.2);
  const stomp = getBenjiSpecialVisualState('stomp', 0.2);
  assert.notEqual(shock.scale, stomp.scale);
  assert.ok(shock.opacity >= 0 && shock.opacity <= 1);
  assert.ok(stomp.opacity >= 0 && stomp.opacity <= 1);
});

test('unknown Benji effects remain safely hidden', () => {
  assert.deepEqual(getBenjiSpecialVisualState('unknown', 0.1), {
    visible: false, progress: 0, scale: 1, opacity: 0, rotation: 0,
  });
});

test('Benji flame effect offset follows left and right facing', () => {
  assert.equal(getBenjiFlameOffset(1), 1.15);
  assert.equal(getBenjiFlameOffset(-1), -1.15);
  assert.equal(getBenjiFlameOffset(0), 1.15);
  assert.equal(getBenjiFlameOffset(Number.NaN), 1.15);
});
