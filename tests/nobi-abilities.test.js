import test from 'node:test';
import assert from 'node:assert/strict';
import { applyNobiAirDash } from '../src/adventure/NobiAbilities.js';

test('Nobi air dash launches forward and gives a small lift', () => {
  const body = { x: 0, y: 3, vx: 0, vy: -4, facing: 1, grounded: false, airDashTimer: 0 };
  assert.equal(applyNobiAirDash(body), true);
  assert.equal(body.vx, 12);
  assert.equal(body.vy, 2.4);
  assert.equal(body.airDashTimer, 0.18);
  assert.equal(body.airDashDirection, 1);
});

test('Nobi air dash respects facing direction and cannot start while grounded or already dashing', () => {
  const body = { vx: 0, vy: 0, facing: -1, grounded: false, airDashTimer: 0 };
  assert.equal(applyNobiAirDash(body), true);
  assert.equal(body.vx, -12);
  assert.equal(applyNobiAirDash(body), false);
  assert.equal(applyNobiAirDash({ grounded: true, facing: 1, airDashTimer: 0 }), false);
});

test('Nobi records the launch direction for the full dash window', () => {
  const body = { vx: 0, vy: 0, facing: -1, grounded: false, airDashTimer: 0 };
  assert.equal(applyNobiAirDash(body), true);
  assert.equal(body.airDashDirection, -1);
});
