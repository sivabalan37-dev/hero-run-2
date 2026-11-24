import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHECKPOINT_STORAGE_KEY,
  getLevelCheckpointX,
  readCheckpoint,
  writeCheckpoint,
} from '../src/adventure/CheckpointSave.js';

function memoryStorage(initial = null) {
  const values = new Map(initial ? [[CHECKPOINT_STORAGE_KEY, initial]] : []);
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    values,
  };
}

test('checkpoint coordinates match all forty authored levels', () => {
  assert.deepEqual(
    Array.from({ length: 40 }, (_, index) => getLevelCheckpointX(index + 1)),
    [22, 24, 26, 30, 34, 38, 42,
      78, 84, 88, 92, 96, 100, 104, 106,
      110, 114, 118, 122, 126, 130, 134, 138,
      142, 146, 150, 154, 158, 162, 166, 170,
      174, 178, 182, 186, 190, 194, 198, 202, 206]
  );
  assert.equal(getLevelCheckpointX(0), null);
  assert.equal(getLevelCheckpointX(41), null);
});

test('valid checkpoint saves round-trip for the same level', () => {
  const storage = memoryStorage();
  const checkpointX = getLevelCheckpointX(8);
  assert.equal(writeCheckpoint(checkpointX, 8, storage), true);
  assert.equal(readCheckpoint(8, storage), checkpointX);
  assert.equal(readCheckpoint(9, storage), -5);
});

test('corrupt, out-of-stage, and mismatched checkpoint values are rejected', () => {
  const invalid = [
    '{"version":1,"levelNumber":8,"checkpointX":220}',
    '{"version":1,"levelNumber":8,"checkpointX":-100}',
    '{"version":1,"levelNumber":9,"checkpointX":78}',
    '{"version":2,"levelNumber":8,"checkpointX":78}',
    '{not-json',
  ];
  for (const value of invalid) {
    assert.equal(readCheckpoint(8, memoryStorage(value)), -5);
  }
});

test('checkpoint writes reject coordinates that are not the authored checkpoint', () => {
  const storage = memoryStorage();
  assert.equal(writeCheckpoint(220, 8, storage), false);
  assert.equal(writeCheckpoint(Number.NaN, 8, storage), false);
  assert.equal(writeCheckpoint(78, 41, storage), false);
  assert.equal(storage.values.has(CHECKPOINT_STORAGE_KEY), false);
});

test('blocked storage safely falls back to the level entrance', () => {
  const storage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  assert.equal(readCheckpoint(8, storage), -5);
  assert.equal(writeCheckpoint(78, 8, storage), false);
});
