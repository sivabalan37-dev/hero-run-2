import test from 'node:test';
import assert from 'node:assert/strict';
import { ScoreSystem, loadNumber, saveNumber } from '../src/game/ScoreSystem.js';

test('score system counts distance, coins, shards and kills', () => {
  const score = new ScoreSystem();
  score.updateDistance(12);
  score.addCoin(); score.addShard(); score.addKill();
  assert.equal(score.distance, 12);
  assert.equal(score.coins, 1);
  assert.equal(score.shards, 1);
  assert.equal(score.kills, 1);
  assert.equal(score.score, 12 + 10 + 35 + 50);
});

test('distance never moves backwards', () => {
  const score = new ScoreSystem();
  score.updateDistance(21); score.updateDistance(10);
  assert.equal(score.distance, 21);
});

test('storage helpers fail safely when storage is unavailable', () => {
  const original = globalThis.localStorage;
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } } });
    assert.equal(loadNumber('score', 5), 5);
    assert.equal(saveNumber('score', 10), false);
  } finally {
    if (original === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
  }
});
