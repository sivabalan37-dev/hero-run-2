import test from 'node:test';
import assert from 'node:assert/strict';
import { createBody, stepBody } from '../src/adventure/PlatformerPhysics.js';

const floor = [{ x: 0, y: -1, width: 30, height: 1 }];

test('body settles on a platform without falling through it', () => {
  const body = createBody(0, 3);
  for (let i = 0; i < 180; i++) stepBody(body, { move: 0 }, floor, 1 / 60);
  assert.equal(body.grounded, true);
  assert.equal(body.y, 0);
  assert.equal(body.vy, 0);
});

test('jump buffer triggers a jump while grounded', () => {
  const body = createBody(0, 0);
  body.grounded = true;
  stepBody(body, { move: 0, jumpPressed: true }, floor, 1 / 60);
  assert.equal(body.grounded, false);
  assert.ok(body.vy > 0);
  assert.equal(body.jumpBuffer, 0);
});

test('horizontal movement respects configured world bounds', () => {
  const body = createBody(0, 0);
  body.grounded = true;
  for (let i = 0; i < 120; i++) stepBody(body, { move: 1 }, floor, 1 / 60, { minX: -3, maxX: 3 });
  assert.ok(body.x <= 3 - body.width / 2);
});
