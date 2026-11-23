import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTHORED_LEVEL_NUMBERS, getLevelDesign } from '../src/adventure/LevelDesigns.js';

test('every campaign stage from 8 through 40 has its own authored layout', () => {
  assert.deepEqual(AUTHORED_LEVEL_NUMBERS, Array.from({ length: 33 }, (_, index) => index + 8));
  const signatures = AUTHORED_LEVEL_NUMBERS.map(level => {
    const design = getLevelDesign(level);
    assert.ok(design.platforms.length >= 6, `level ${level} needs at least six authored platforms`);
    assert.ok(design.enemyRatios.length >= 3, `level ${level} needs authored enemy placements`);
    assert.ok(design.coinRatios.length >= 13, `level ${level} needs an authored coin route`);
    for (const platform of design.platforms) {
      assert.ok(platform.xRatio > 0 && platform.xRatio < 1);
      assert.ok(platform.height >= 1.5 && platform.height <= 4);
      assert.ok(platform.width >= 3 && platform.width <= 4.5);
    }
    for (const ratio of [...design.enemyRatios, ...design.coinRatios]) {
      assert.ok(ratio > 0 && ratio < 1);
    }
    return JSON.stringify(design);
  });
  assert.equal(new Set(signatures).size, 33, 'each stage should have a distinct layout');
});

test('boss stages have a dedicated arena layout marker', () => {
  for (const level of [8, 16, 24, 32, 40]) {
    assert.equal(getLevelDesign(level).route, 'boss-arena');
  }
});

test('out-of-range and previously authored levels use the correct fallback', () => {
  assert.equal(getLevelDesign(1), null);
  assert.equal(getLevelDesign(7), null);
  assert.equal(getLevelDesign(41), null);
});
