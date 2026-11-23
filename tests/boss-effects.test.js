import test from 'node:test';
import assert from 'node:assert/strict';
import { getBossAttackVisualState } from '../src/adventure/BossEffects.js';

const boss = (type, bossMode) => ({
  attackType: type,
  attackProfile: { type },
  bossMode,
});

test('each boss telegraph uses its own warning color', () => {
  const cases = [
    ['ground-slam', '#ff9957'],
    ['gear-dash', '#ffe36e'],
    ['vine-sweep', '#8ee68b'],
    ['pulse-blast', '#7be9ff'],
    ['time-wave', '#d7a0ff'],
  ];
  for (const [type, color] of cases) {
    const state = getBossAttackVisualState(boss(type, 'telegraph'), 0.5);
    assert.equal(state.visible, true);
    assert.equal(state.color, color);
    assert.ok(state.opacity > 0.19 && state.opacity < 0.45);
  }
});

test('five boss strikes have distinct visual transforms', () => {
  const types = ['ground-slam', 'gear-dash', 'vine-sweep', 'pulse-blast', 'time-wave'];
  const transforms = types.map(type => {
    const state = getBossAttackVisualState(boss(type, 'strike'), 1);
    assert.equal(state.visible, true);
    assert.equal(state.opacity, 0.92);
    return [state.scaleX, state.scaleY, state.rotation, state.lift].join(':');
  });
  assert.equal(new Set(transforms).size, 5);
});

test('recovery fades and inactive boss effects are hidden', () => {
  const recovering = getBossAttackVisualState(boss('pulse-blast', 'recover'), 2);
  const idle = getBossAttackVisualState(boss('pulse-blast', 'approach'), 2);
  assert.equal(recovering.visible, true);
  assert.equal(recovering.opacity, 0.18);
  assert.equal(idle.visible, false);
  assert.equal(idle.opacity, 0);
});

test('invalid elapsed time returns finite transforms', () => {
  const state = getBossAttackVisualState(boss('time-wave', 'telegraph'), Number.NaN);
  assert.ok(Number.isFinite(state.scaleX));
  assert.ok(Number.isFinite(state.opacity));
});
