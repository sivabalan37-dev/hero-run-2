import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressState, recordLevelCompletion } from '../src/adventure/CampaignProgress.js';
import { getCampaignSummary } from '../src/adventure/CampaignSummary.js';

test('fresh campaign summary starts at zero and is not complete', () => {
  assert.deepEqual(getCampaignSummary(createProgressState()), {
    campaignComplete: false, completedLevels: 0, totalLevels: 40,
    totalStars: 0, maxStars: 120, totalCoins: 0,
    completedBossLevels: 0, totalBossLevels: 5,
  });
});

test('summary totals completed levels, best stars, coins and boss stages', () => {
  let progress = createProgressState();
  progress = recordLevelCompletion(progress, 8, 7, 3);
  progress = recordLevelCompletion(progress, 40, 5, 2);
  const summary = getCampaignSummary(progress);
  assert.equal(summary.completedLevels, 2);
  assert.equal(summary.totalStars, 5);
  assert.equal(summary.totalCoins, 12);
  assert.equal(summary.completedBossLevels, 2);
  assert.equal(summary.campaignComplete, false);
});

test('campaign is complete only after all 40 distinct levels are cleared', () => {
  let progress = createProgressState();
  for (let level = 1; level <= 39; level++) {
    progress = recordLevelCompletion(progress, level, 1, 3);
  }
  assert.equal(getCampaignSummary(progress).campaignComplete, false);
  progress = recordLevelCompletion(progress, 40, 1, 3);
  const summary = getCampaignSummary(progress);
  assert.equal(summary.campaignComplete, true);
  assert.equal(summary.completedLevels, 40);
  assert.equal(summary.totalStars, 120);
  assert.equal(summary.totalCoins, 40);
});

test('replaying a level does not inflate campaign summary totals', () => {
  let progress = recordLevelCompletion(createProgressState(), 1, 8, 2);
  progress = recordLevelCompletion(progress, 1, 99, 1);
  const summary = getCampaignSummary(progress);
  assert.equal(summary.completedLevels, 1);
  assert.equal(summary.totalCoins, 8);
  assert.equal(summary.totalStars, 2);
});
