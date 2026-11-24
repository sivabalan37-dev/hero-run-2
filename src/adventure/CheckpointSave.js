export const CHECKPOINT_STORAGE_KEY = 'hero-run-time-travel-save-v1';

export function getLevelCheckpointX(levelNumber) {
  if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > 40) return null;
  const earlyCheckpoints = [22, 24, 26, 30, 34, 38, 42];
  if (levelNumber <= 7) return earlyCheckpoints[levelNumber - 1];
  const exitX = 58 + (levelNumber - 7) * 4;
  return exitX - (levelNumber % 8 === 0 ? 12 : 16);
}

export function readCheckpoint(levelNumber, storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    const expectedX = getLevelCheckpointX(levelNumber);
    if (expectedX === null) return -5;
    const value = JSON.parse(target?.getItem(CHECKPOINT_STORAGE_KEY) || 'null');
    if (value?.version === 1
      && value.levelNumber === levelNumber
      && Number.isFinite(value.checkpointX)
      && Math.abs(value.checkpointX - expectedX) <= 0.01) {
      return expectedX;
    }
  } catch { /* Corrupt or blocked storage starts from the level entrance. */ }
  return -5;
}

export function writeCheckpoint(checkpointX, levelNumber, storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    const expectedX = getLevelCheckpointX(levelNumber);
    if (!target || typeof target.setItem !== 'function'
      || expectedX === null
      || !Number.isFinite(checkpointX)
      || Math.abs(checkpointX - expectedX) > 0.01) return false;
    target.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify({
      version: 1,
      levelNumber,
      checkpointX: expectedX,
      savedAt: Date.now(),
    }));
    return true;
  } catch { return false; }
}
