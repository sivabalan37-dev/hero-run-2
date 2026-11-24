import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressState, recordLevelCompletion, saveCampaignProgress, loadCampaignProgress } from '../src/adventure/CampaignProgress.js';
import { getEquippedTitle, getTitleOptions, selectTitle } from '../src/adventure/Titles.js';

test('new campaigns start without an equipped title and keep legacy saves compatible', () => {
  assert.equal(createProgressState().equippedTitle, null);
  const legacy = createProgressState({ version: 1, completedLevels: [1], totalCoins: 3, selectedCharacter: 'shin' });
  assert.equal(legacy.equippedTitle, null);
});

test('only titles from unlocked achievements can be equipped', () => {
  const fresh = createProgressState();
  assert.equal(selectTitle(fresh, 'world_explorer'), null);
  assert.equal(selectTitle(fresh, 'unknown_title'), null);
  const earned = recordLevelCompletion(fresh, 1, 2, 1);
  const selected = selectTitle(earned, 'first_steps');
  assert.equal(selected.equippedTitle, 'first_steps');
  assert.equal(getEquippedTitle(selected), 'Rookie adventurer');
  assert.equal(getTitleOptions(selected).find(item => item.id === 'first_steps').unlocked, true);
});

test('a locked or unknown saved title is never shown as equipped', () => {
  const forged = createProgressState({ version: 1, completedLevels: [], totalCoins: 0, selectedCharacter: 'shin', equippedTitle: 'perfect_campaign' });
  assert.equal(getEquippedTitle(forged), null);
  assert.equal(selectTitle(forged, 'perfect_campaign'), null);
});

test('players can unequip a title and the selection persists across save/load', () => {
  const store = new Map();
  const storage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  const earned = selectTitle(recordLevelCompletion(createProgressState(), 1, 0, 1), 'first_steps');
  assert.equal(saveCampaignProgress(earned, storage), true);
  assert.equal(getEquippedTitle(loadCampaignProgress(storage)), 'Rookie adventurer');
  const cleared = selectTitle(earned, null);
  assert.equal(cleared.equippedTitle, null);
  assert.equal(getEquippedTitle(cleared), null);
  assert.equal(saveCampaignProgress(cleared, storage), true);
  assert.equal(loadCampaignProgress(storage).equippedTitle, null);
});
