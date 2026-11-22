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
  assert.deepEqual(PLAYABLE_LEVELS, Array.from({ length: 40 }, (_, index) => index + 1));
  assert.equal(getLevelInfo(2).playable, true);
  assert.equal(getLevelInfo(3).playable, true);
  assert.equal(getLevelInfo(4).playable, true);
  assert.equal(getLevelInfo(5).playable, true);
  assert.equal(getLevelInfo(5).title, 'Sunny Neighborhood · Riverside Park');
  assert.equal(getLevelInfo(6).playable, true);
  assert.equal(getLevelInfo(6).title, 'Sunny Neighborhood · Clocktower Climb');
  assert.equal(getLevelInfo(7).playable, true);
  assert.equal(getLevelInfo(7).title, 'Sunny Neighborhood · Rooftop Relay');
  assert.equal(getLevelInfo(8).playable, true);
  assert.equal(getLevelInfo(16).playable, true);
  assert.equal(getLevelInfo(24).playable, true);
  assert.equal(getLevelInfo(32).playable, true);
  assert.equal(getLevelInfo(40).playable, true);
  assert.equal(getLevelInfo(40).title, 'Time-Travel Castle · Ultimate Time Showdown');
});

test('level catalog rejects invalid level numbers', () => {
  assert.throws(() => getLevelInfo(0), RangeError);
  assert.throws(() => getLevelInfo(41), RangeError);
});
