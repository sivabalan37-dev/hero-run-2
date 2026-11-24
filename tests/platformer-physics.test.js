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

test('holding sprint increases running speed without exceeding the safe speed cap', () => {
  const normal = createBody(0, 0);
  const sprinting = createBody(0, 0);
  normal.grounded = true;
  sprinting.grounded = true;

  for (let i = 0; i < 90; i++) {
    stepBody(normal, { move: 1 }, floor, 1 / 60);
    stepBody(sprinting, { move: 1, sprint: true }, floor, 1 / 60);
  }

  assert.ok(sprinting.vx > normal.vx, 'sprint should increase the top running speed');
  assert.ok(sprinting.vx <= 20, 'sprint speed must remain within the physics cap');
  assert.ok(sprinting.x > normal.x, 'sprinting should cover more ground over the same time');
});

test('sprint without a movement direction does not move the player', () => {
  const body = createBody(0, 0);
  body.grounded = true;
  for (let i = 0; i < 20; i++) stepBody(body, { move: 0, sprint: true }, floor, 1 / 60);
  assert.equal(body.x, 0);
  assert.equal(body.vx, 0);
});

test('pressing into a wall while falling enables controlled wall sliding', () => {
  const wall = { x: 2, y: -1, width: 1, height: 8, solidSides: true };
  const body = createBody(1.11, 4);
  body.vy = -12;
  for (let i = 0; i < 4; i++) {
    stepBody(body, { move: 1 }, [wall], 1 / 60);
  }
  assert.equal(body.wallContactDirection, 1);
  assert.equal(body.wallSliding, true);
  assert.ok(body.vy >= -5.8, 'wall slide should limit downward speed');
  assert.ok(body.vy < 0, 'wall slide must not lift the player');
});

test('jumping while touching a wall launches away from it', () => {
  const wall = { x: 2, y: -1, width: 1, height: 8, solidSides: true };
  const body = createBody(1.11, 3);
  body.vy = -2;
  stepBody(body, { move: 1 }, [wall], 1 / 60);
  assert.equal(body.wallContactDirection, 1);

  stepBody(body, { move: 1, jumpPressed: true }, [wall], 1 / 60);
  assert.ok(body.vx < 0, 'wall jump should launch horizontally away from the wall');
  assert.ok(body.vy > 0, 'wall jump should launch upward');
  assert.equal(body.facing, -1);
  assert.equal(body.wallSliding, false);
});

test('wall slide requires pressing toward the wall and does not trigger on open air', () => {
  const wall = { x: 2, y: -1, width: 1, height: 8, solidSides: true };
  const body = createBody(1.11, 4);
  body.vy = -8;
  stepBody(body, { move: -1 }, [wall], 1 / 60);
  assert.equal(body.wallSliding, false);

  const openAir = createBody(0, 4);
  openAir.vy = -8;
  stepBody(openAir, { move: 1, jumpPressed: true }, [], 1 / 60);
  assert.ok(openAir.vy < 0, 'jumping without a wall should not create a wall jump');
});


test('crouching lowers the collision body without moving the feet', () => {
  const body = createBody(0, 0);
  body.grounded = true;
  const feet = body.y;
  stepBody(body, { move: 0, crouch: true }, floor, 1 / 60);
  assert.equal(body.crouching, true);
  assert.equal(body.height, body.crouchHeight);
  assert.equal(body.y, feet);
});

test('standing remains blocked while a low ceiling overlaps the standing height', () => {
  const ceiling = { x: 0, y: 1.45, width: 4, height: 1, solidSides: true };
  const body = createBody(0, 0);
  body.grounded = true;
  stepBody(body, { move: 0, crouch: true }, [...floor, ceiling], 1 / 60);
  assert.equal(body.height, body.crouchHeight);
  stepBody(body, { move: 0, crouch: false }, [...floor, ceiling], 1 / 60);
  assert.equal(body.crouching, true);
  assert.equal(body.height, body.crouchHeight);
  stepBody(body, { move: 0, crouch: false }, floor, 1 / 60);
  assert.equal(body.crouching, false);
  assert.equal(body.height, body.standingHeight);
  assert.equal(body.y, 0);
});

test('ground slide starts from running momentum and remains within its speed cap', () => {
  const body = createBody(0, 0);
  body.grounded = true;
  body.vx = 7;
  stepBody(body, { move: 1, crouch: true }, floor, 1 / 60);
  assert.ok(body.slideTimer > 0);
  assert.equal(body.slideDirection, 1);
  assert.ok(body.vx <= 12.5);
  assert.ok(body.vx > 7);
  for (let i = 0; i < 30; i++) stepBody(body, { move: 1, crouch: true }, floor, 1 / 60);
  assert.equal(body.slideTimer, 0);
  assert.ok(body.vx <= 7.2 * 0.55 + 0.1);
});

test('crouch does not trigger a ground slide in mid-air', () => {
  const body = createBody(0, 4);
  body.vx = 7;
  stepBody(body, { move: 1, crouch: true }, [], 1 / 60);
  assert.equal(body.slideTimer, 0);
});
