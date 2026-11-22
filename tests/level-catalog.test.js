import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevelInfo, PLAYABLE_LEVELS, WORLDS } from '../src/adventure/LevelCatalog.js';

test('campaign maps eight levels to each of its five worlds', () => {
  assert.equal(WORLDS.length, 5);
  assert.deepEqual(WORLDS.map(world => world.lastLevel - world.firstLevel + 1), [8, 8, 8, 8, 8]);
  assert.equal(getLevelInfo(1).world, 'Sunny Neighborhood');
  assert.equal(getLevelInfo(8).boss, 'Neighborhood Guardian');
  assert.equal(getLevelInfo(9).world, 'School Playground');
  assert.equal(getLevelInfo(40).boss, 'Ultimate Time Guardian');
});

test('only implemented levels are advertised as playable', () => {
  assert.deepEqual(PLAYABLE_LEVELS, [1, 2]);
  assert.equal(getLevelInfo(2).playable, true);
  assert.equal(getLevelInfo(3).playable, false);
});

test('level catalog rejects invalid level numbers', () => {
  assert.throws(() => getLevelInfo(0), RangeError);
  assert.throws(() => getLevelInfo(41), RangeError);
});
