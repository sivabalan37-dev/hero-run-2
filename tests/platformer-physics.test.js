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

test('glide input reduces Nobi fall speed while airborne', () => {
  const normal = createBody(0, 8);
  const gliding = createBody(0, 8);
  normal.vy = -8;
  gliding.vy = -8;
  stepBody(normal, { move: 0 }, [], 1 / 60);
  stepBody(gliding, { move: 0, glide: true }, [], 1 / 60);
  assert.ok(gliding.vy > normal.vy, 'gliding velocity should be less downward');
  assert.ok(gliding.vy < 0, 'glide should not turn a fall into a rise');
});

test('glide applies a safe terminal fall-speed cap', () => {
  const body = createBody(0, 8);
  body.vy = -21;
  stepBody(body, { move: 0, glide: true }, [], 1 / 60);
  assert.ok(body.vy >= -5.2);
});


test('character movement tuning changes speed and jump strength safely', () => {
  const normal = createBody(0, 0);
  const blaze = createBody(0, 0);
  normal.grounded = true;
  blaze.grounded = true;
  for (let i = 0; i < 8; i++) {
    stepBody(normal, { move: 1 }, floor, 1 / 60);
    stepBody(blaze, { move: 1 }, floor, 1 / 60, null, { moveSpeed: 9.4, acceleration: 52, jumpSpeed: 11 });
  }
  assert.ok(blaze.vx > normal.vx);

  const titanJump = createBody(0, 0);
  titanJump.grounded = true;
  stepBody(titanJump, { move: 0, jumpPressed: true }, floor, 1 / 60, null, { jumpSpeed: 9.8 });
  assert.ok(titanJump.vy < 10.8);
  assert.ok(titanJump.vy > 0);
});

test('Nobi can perform one additional jump while airborne', () => {
  const body = createBody(0, 4);
  body.maxAirJumps = 1;
  body.airJumpsRemaining = 1;
  body.vy = -2;
  stepBody(body, { move: 0, jumpPressed: true }, [], 1 / 60);
  assert.ok(body.vy > 0, 'air jump should launch upward');
  assert.equal(body.airJumpsRemaining, 0);
});

test('air jumps reset after landing and a new grounded jump', () => {
  const body = createBody(0, 0);
  body.maxAirJumps = 1;
  body.airJumpsRemaining = 0;
  body.grounded = true;
  stepBody(body, { move: 0, jumpPressed: true }, floor, 1 / 60);
  assert.equal(body.airJumpsRemaining, 1);
});

test('air dash holds its burst speed for the configured short window', () => {
  const body = createBody(0, 3);
  body.facing = 1;
  body.airDashTimer = 0.18;
  body.airDashSpeed = 12;
  stepBody(body, { move: 0 }, [], 1 / 60);
  assert.equal(body.vx, 12);
  assert.ok(body.airDashTimer < 0.18 && body.airDashTimer > 0);
});

test('air dash direction stays locked when opposite movement is pressed', () => {
  const body = createBody(0, 3);
  body.facing = 1;
  body.airDashDirection = 1;
  body.airDashTimer = 0.18;
  body.airDashSpeed = 12;

  stepBody(body, { move: -1 }, [], 1 / 60);

  assert.equal(body.facing, 1, 'dash should keep the launch facing direction');
  assert.equal(body.vx, 12, 'opposite input must not reverse the dash');
  assert.equal(body.airDashDirection, 1);
});

test('normal movement can change facing again after the dash ends', () => {
  const body = createBody(0, 3);
  body.facing = 1;
  body.airDashDirection = 1;
  body.airDashTimer = 1 / 60;
  body.airDashSpeed = 12;

  stepBody(body, { move: -1 }, [], 1 / 60);
  stepBody(body, { move: -1 }, [], 1 / 60);

  assert.equal(body.airDashTimer, 0);
  assert.equal(body.airDashDirection, 0);
  assert.equal(body.facing, -1);
});
