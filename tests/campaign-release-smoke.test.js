import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevelInfo, PLAYABLE_LEVELS, WORLDS } from '../src/adventure/LevelCatalog.js';
import { getLevelDesign, AUTHORED_LEVEL_NUMBERS } from '../src/adventure/LevelDesigns.js';

// These automated checks guard all campaign data before physical-device gameplay QA.

test('every campaign level has valid catalog metadata and belongs to exactly one world', () => {
  assert.equal(PLAYABLE_LEVELS.length, 40);
  for (let level = 1; level <= 40; level += 1) {
    const info = getLevelInfo(level);
    assert.equal(info.number, level);
    assert.equal(info.playable, true);
    assert.ok(info.title.length > 0);
    assert.equal(WORLDS.filter(world => level >= world.firstLevel && level <= world.lastLevel).length, 1);
    assert.equal(info.isBossLevel, [8, 16, 24, 32, 40].includes(level));
    assert.equal(Boolean(info.boss), info.isBossLevel);
  }
});

test('all 33 authored encounter layouts have safe normalized platform, enemy and coin data', () => {
  assert.deepEqual(AUTHORED_LEVEL_NUMBERS, Array.from({ length: 33 }, (_, index) => index + 8));
  for (let level = 8; level <= 40; level += 1) {
    const design = getLevelDesign(level);
    assert.ok(design, `level ${level} has an encounter layout`);
    assert.ok(design.platforms.length >= 5, `level ${level} has enough platforms`);
    for (const platform of design.platforms) {
      assert.ok(Number.isFinite(platform.xRatio) && platform.xRatio > 0 && platform.xRatio < 1);
      assert.ok(Number.isFinite(platform.height) && platform.height > 0);
      assert.ok(Number.isFinite(platform.width) && platform.width > 0);
    }
    for (const ratio of [...design.enemyRatios, ...design.coinRatios]) {
      assert.ok(Number.isFinite(ratio) && ratio > 0 && ratio < 1);
    }
    assert.ok(design.coinRatios.length >= 10, `level ${level} has collectible placements`);
    assert.equal(design.route === 'boss-arena', [8, 16, 24, 32, 40].includes(level));
  }
});

test('encounter layouts safely reject levels outside their authored range', () => {
  assert.equal(getLevelDesign(1), null);
  assert.equal(getLevelDesign(7), null);
  assert.equal(getLevelDesign(41), null);
});
