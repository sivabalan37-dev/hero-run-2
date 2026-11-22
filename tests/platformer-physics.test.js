import test from 'node:test';
import assert from 'node:assert/strict';
import { createBody, stepBody } from '../src/adventure/PlatformerPhysics.js';

const floor = [{ x: 0, y: -1, width: 30, height: 1, solidSides: true }];

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

test('raised platforms can be passed from the side but catch a falling player', () => {
  const raised = [{ x: 0, y: 1.2, width: 4, height: 0.5 }];
  const body = createBody(-3, 0);
  body.grounded = true;
  for (let i = 0; i < 60; i++) stepBody(body, { move: 1 }, [...floor, ...raised], 1 / 60);
  assert.ok(body.x > -1, 'player should be able to walk below the raised ledge');
  body.x = 0;
  body.y = 3;
  body.vy = -2;
  body.grounded = false;
  for (let i = 0; i < 45; i++) stepBody(body, { move: 0 }, [...floor, ...raised], 1 / 60);
  assert.equal(body.y, 1.7);
  assert.equal(body.grounded, true);
});

test('jump input is buffered briefly before landing', () => {
  const body = createBody(0, 0.14);
  body.vy = -2;
  body.grounded = false;
  stepBody(body, { move: 0, jumpPressed: true }, floor, 1 / 60);
  for (let i = 0; i < 12 && body.vy < 0; i++) {
    stepBody(body, { move: 0 }, floor, 1 / 60);
  }
  assert.ok(body.vy > 0);
});
