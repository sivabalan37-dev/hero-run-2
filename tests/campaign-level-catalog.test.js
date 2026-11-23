import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_LEVELS, getCampaignLevel, isCampaignLevelUnlocked, getCampaignCheckpointDistances, getCampaignStarRating, getCampaignProgress } from '../src/adventure/CampaignLevelCatalog.js';

test('campaign catalog exposes 33 immutable playable level definitions', () => {
  assert.equal(CAMPAIGN_LEVELS.length, 33);
  assert.equal(getCampaignLevel(8).length, 1200);
  assert.equal(getCampaignLevel(40).length, 3760);
  assert.equal(getCampaignLevel(7), null);
  assert.equal(getCampaignLevel(41), null);
  assert.equal(Object.isFrozen(getCampaignLevel(8).obstacles), true);
});

test('campaign unlocks level 8 initially and gates each later level on its predecessor', () => {
  assert.equal(isCampaignLevelUnlocked(8, []), true);
  assert.equal(isCampaignLevelUnlocked(9, []), false);
  assert.equal(isCampaignLevelUnlocked(9, [8]), true);
  assert.equal(isCampaignLevelUnlocked(10, [8]), false);
  assert.equal(isCampaignLevelUnlocked(10, [8, 9]), true);
});

test('checkpoint distances are ordered quarter-distance marks', () => {
  assert.deepEqual(getCampaignCheckpointDistances(8), [300, 600, 900, 1200]);
  assert.deepEqual(getCampaignCheckpointDistances(16), [460, 920, 1380]);
  assert.deepEqual(getCampaignCheckpointDistances(7), []);
});

test('star rating requires surviving with at least one health', () => {
  assert.equal(getCampaignStarRating({ levelNumber: 8, health: 0, coins: 30, gems: 1 }), 0);
  assert.equal(getCampaignStarRating({ levelNumber: 8, health: 1, coins: 0, gems: 0 }), 1);
  assert.equal(getCampaignStarRating({ levelNumber: 8, health: 2, coins: 20, gems: 1 }), 2);
  assert.equal(getCampaignStarRating({ levelNumber: 8, health: 3, coins: 30, gems: 1 }), 3);
});

test('campaign progress clamps to the level range', () => {
  assert.equal(getCampaignProgress(-10, 8), 0);
  assert.equal(getCampaignProgress(600, 8), 0.5);
  assert.equal(getCampaignProgress(2000, 8), 1);
  assert.equal(getCampaignProgress(10, 7), 0);
});
