import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createProgressState,
  getUnlockedCharacters,
  isCharacterUnlocked,
  recordLevelCompletion,
  selectCharacter,
  loadCampaignProgress,
  saveCampaignProgress,
} from '../src/adventure/CampaignProgress.js';

test('only Shin is unlocked in a new campaign', () => {
  const progress = createProgressState();
  assert.deepEqual(getUnlockedCharacters(progress), ['shin']);
  assert.equal(progress.currentLevel, 1);
});

test('Nobi unlocks after three distinct completed levels', () => {
  let progress = createProgressState();
  progress = recordLevelCompletion(progress, 1, 5);
  progress = recordLevelCompletion(progress, 2, 7);
  assert.equal(isCharacterUnlocked(progress, 'nobi'), false);
  progress = recordLevelCompletion(progress, 3, 3);
  assert.equal(isCharacterUnlocked(progress, 'nobi'), true);
  assert.equal(progress.totalCoins, 15);
});

test('Benji unlocks after six distinct completed levels', () => {
  let progress = createProgressState();
  for (let level = 1; level <= 5; level++) progress = recordLevelCompletion(progress, level);
  assert.equal(isCharacterUnlocked(progress, 'benji'), false);
  progress = recordLevelCompletion(progress, 6);
  assert.equal(isCharacterUnlocked(progress, 'benji'), true);
});

test('locked characters cannot be selected and unlocked characters can', () => {
  const fresh = createProgressState();
  assert.equal(selectCharacter(fresh, 'nobi'), null);
  let afterThree = fresh;
  for (const level of [1, 2, 3]) afterThree = recordLevelCompletion(afterThree, level);
  assert.equal(selectCharacter(afterThree, 'nobi').selectedCharacter, 'nobi');
});

test('next level follows contiguous completion rather than highest number', () => {
  const progress = createProgressState({ version: 1, completedLevels: [1, 3, 4] });
  assert.equal(progress.currentLevel, 2);
});

test('invalid save values are sanitized without unlocking characters', () => {
  const progress = createProgressState({
    version: 1,
    completedLevels: [1, 1, 0, 41, '2', 2.5],
    totalCoins: -40,
    selectedCharacter: 'benji',
  });
  assert.deepEqual(progress.completedLevels, [1]);
  assert.equal(progress.totalCoins, 0);
  assert.equal(progress.selectedCharacter, 'shin');
});

test('storage load and save safely handle blocked storage', () => {
  const storage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  assert.equal(loadCampaignProgress(storage).currentLevel, 1);
  assert.equal(saveCampaignProgress(createProgressState(), storage), false);
});

test('campaign progress can be saved and loaded with completed levels and selection', () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  let progress = createProgressState();
  for (const level of [1, 2, 3]) progress = recordLevelCompletion(progress, level, 4);
  progress = selectCharacter(progress, 'nobi');
  assert.equal(saveCampaignProgress(progress, storage), true);
  const loaded = loadCampaignProgress(storage);
  assert.deepEqual(loaded.completedLevels, [1, 2, 3]);
  assert.equal(loaded.selectedCharacter, 'nobi');
  assert.equal(loaded.totalCoins, 12);
});

test('invalid campaign data is not written over an existing valid save', () => {
  const values = new Map([['hero-run-campaign-progress-v1', '{"version":1,"completedLevels":[1],"totalCoins":0,"selectedCharacter":"shin"}']]);
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  assert.equal(saveCampaignProgress({ version: 2, completedLevels: [], totalCoins: 0 }, storage), false);
  assert.match(values.get('hero-run-campaign-progress-v1'), /"completedLevels":\[1\]/);
});

test('a fully completed campaign advances to terminal level 41', () => {
  const progress = createProgressState({
    version: 1,
    completedLevels: Array.from({ length: 40 }, (_, index) => index + 1),
  });
  assert.equal(progress.currentLevel, 41);
});
