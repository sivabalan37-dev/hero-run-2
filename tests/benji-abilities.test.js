import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyBenjiSpecial,
  getBenjiFormStats,
  getBenjiDamageTaken,
} from '../src/adventure/BenjiAbilities.js';

function enemy(x, health = 2, enemyType = 'robo-bug', isBoss = false) {
  return {
    x,
    enemyType,
    isBoss,
    minX: x - 3,
    maxX: x + 3,
    health,
    hurtTimer: 0,
    alive: true,
    state: 'patrol',
    group: { visible: true },
  };
}

const groundedHero = (overrides = {}) => ({
  x: 0,
  y: 0,
  facing: 1,
  grounded: true,
  ...overrides,
});

test('Benji forms provide distinct movement, cooldown and defense profiles', () => {
  assert.ok(getBenjiFormStats('blaze').movement.moveSpeed > getBenjiFormStats('normal').movement.moveSpeed);
  assert.ok(getBenjiFormStats('shock').movement.jumpSpeed > getBenjiFormStats('normal').movement.jumpSpeed);
  assert.ok(getBenjiFormStats('titan').movement.moveSpeed < getBenjiFormStats('normal').movement.moveSpeed);
  assert.equal(getBenjiFormStats('titan').damageMultiplier, 0.5);
  assert.equal(getBenjiFormStats('unknown').damageMultiplier, 1);
});

test('Titan applies its exact 50 percent damage reduction without rounding', () => {
  assert.equal(getBenjiDamageTaken(25, 'titan'), 12.5);
  assert.equal(getBenjiDamageTaken(25, 'normal'), 25);
  assert.equal(getBenjiDamageTaken(25, 'blaze'), 25);
  assert.equal(getBenjiDamageTaken(25, 'shock'), 25);
});

test('Benji damage calculation safely handles invalid and negative base damage', () => {
  assert.equal(getBenjiDamageTaken(-5, 'titan'), 0);
  assert.equal(getBenjiDamageTaken(Number.NaN, 'titan'), 0);
  assert.equal(getBenjiDamageTaken(Number.POSITIVE_INFINITY, 'titan'), 0);
});

test('Blaze strikes enemies in front and does not hit enemies behind Benji', () => {
  const front = enemy(3.5);
  const behind = enemy(-2);
  const result = applyBenjiSpecial('blaze', groundedHero(), [front, behind]);
  assert.equal(result.ability, 'flame');
  assert.equal(result.hits, 1);
  assert.equal(front.health, 0);
  assert.equal(front.alive, false);
  assert.equal(front.group.visible, false);
  assert.equal(behind.health, 2);
});

test('Shock pulse damages multiple enemies inside its radius only', () => {
  const closeA = enemy(1.5);
  const closeB = enemy(-3.5);
  const far = enemy(5.1);
  const result = applyBenjiSpecial('shock', groundedHero(), [closeA, closeB, far]);
  assert.equal(result.ability, 'shock');
  assert.equal(result.hits, 2);
  assert.equal(result.defeated, 2);
  assert.equal(far.health, 2);
});

test('Shock pulse respects vertical separation while still reaching hovering targets', () => {
  const groundTarget = enemy(1.5);
  const drone = enemy(-2, 2, 'drone-scout');
  const airborne = groundedHero({ y: 2.2 });
  const result = applyBenjiSpecial('shock', airborne, [groundTarget, drone]);

  assert.equal(result.hits, 1);
  assert.equal(groundTarget.health, 2);
  assert.equal(drone.health, 0);
});

test('Titan stomp requires landing and deals heavy area damage with knockback', () => {
  const target = enemy(2, 3);
  const airborne = applyBenjiSpecial('titan', groundedHero({ grounded: false }), [target]);
  assert.equal(airborne.ready, false);
  assert.equal(target.health, 3);

  const landed = applyBenjiSpecial('titan', groundedHero(), [target]);
  assert.equal(landed.ready, true);
  assert.equal(landed.hits, 1);
  assert.equal(landed.defeated, 1);
  assert.equal(target.health, 0);
});
