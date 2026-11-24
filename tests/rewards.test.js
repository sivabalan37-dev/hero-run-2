import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressState, loadCampaignProgress, recordLevelCompletion, saveCampaignProgress } from '../src/adventure/CampaignProgress.js';
import { getEquippedTitle, getTitleRewards, selectAchievementTitle } from '../src/adventure/Rewards.js';

test('legacy campaign saves migrate with no equipped title', () => {
  const progress = createProgressState({ version: 1, completedLevels: [1], totalCoins: 4, selectedCharacter: 'shin' });
  assert.equal(progress.equippedTitle, null);
});

test('locked achievement titles cannot be equipped', () => {
  const progress = createProgressState();
  assert.equal(selectAchievementTitle(progress, 'first_steps'), null);
  assert.equal(selectAchievementTitle(progress, 'unknown_title'), null);
});

test('earned titles can be equipped and cleared', () => {
  const earned = recordLevelCompletion(createProgressState(), 1, 0, 1);
  const selected = selectAchievementTitle(earned, 'first_steps');
  assert.equal(selected.equippedTitle, 'first_steps');
  assert.equal(getEquippedTitle(selected).title, 'Rookie adventurer');
  assert.equal(selectAchievementTitle(selected, null).equippedTitle, null);
});

test('equipped titles persist through campaign save and load', () => {
  const values = new Map();
  const storage = { getItem(key) { return values.get(key) ?? null; }, setItem(key, value) { values.set(key, value); } };
  const earned = recordLevelCompletion(createProgressState(), 1, 0, 1);
  const selected = selectAchievementTitle(earned, 'first_steps');
  assert.equal(saveCampaignProgress(selected, storage), true);
  assert.equal(loadCampaignProgress(storage).equippedTitle, 'first_steps');
});

test('a saved title is hidden if its achievement is no longer earned', () => {
  const tampered = createProgressState({ version: 1, completedLevels: [], totalCoins: 0, equippedTitle: 'first_steps' });
  assert.equal(getEquippedTitle(tampered), null);
  assert.equal(getTitleRewards(tampered).find(item => item.id === 'first_steps').unlocked, false);
});
