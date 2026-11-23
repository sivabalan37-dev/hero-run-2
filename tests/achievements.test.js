import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressState, recordLevelCompletion } from '../src/adventure/CampaignProgress.js';
import { ACHIEVEMENTS, BOSS_LEVELS, getAchievementProgress, getAchievementStats } from '../src/adventure/Achievements.js';

test('fresh campaign starts with all achievements locked and zero progress', () => {
  const progress = createProgressState();
  const achievements = getAchievementProgress(progress);
  assert.equal(achievements.length, 10);
  assert.ok(achievements.every(item => !item.unlocked && item.value === 0));
  assert.deepEqual(getAchievementStats(progress), {
    levels: 0, shards: 0, stars: 0, coins: 0, bosses: 0, heroes: 1,
  });
});

test('level, shard, star and coin achievements follow saved campaign records', () => {
  let progress = createProgressState();
  progress = recordLevelCompletion(progress, 1, 25, 3);
  progress = recordLevelCompletion(progress, 2, 10, 2);
  const stats = getAchievementStats(progress);
  assert.equal(stats.levels, 2);
  assert.equal(stats.shards, 2);
  assert.equal(stats.stars, 5);
  assert.equal(stats.coins, 35);
  const items = getAchievementProgress(progress);
  assert.equal(items.find(item => item.id === 'first_steps').unlocked, true);
  assert.equal(items.find(item => item.id === 'coin_pouch').unlocked, true);
  assert.equal(items.find(item => item.id === 'shard_seeker').unlocked, false);
});

test('replaying levels never inflates level, star or coin achievement totals', () => {
  let progress = createProgressState();
  progress = recordLevelCompletion(progress, 1, 12, 3);
  progress = recordLevelCompletion(progress, 1, 99, 1);
  const stats = getAchievementStats(progress);
  assert.equal(stats.levels, 1);
  assert.equal(stats.stars, 3);
  assert.equal(stats.coins, 12);
});

test('boss hunter counts only completed boss-gated levels', () => {
  let progress = createProgressState();
  for (const level of [1, 8, 16, 24, 32]) progress = recordLevelCompletion(progress, level);
  assert.equal(BOSS_LEVELS.length, 5);
  assert.equal(getAchievementStats(progress).bosses, 4);
  assert.equal(getAchievementProgress(progress).find(item => item.id === 'boss_hunter').unlocked, false);
  progress = recordLevelCompletion(progress, 40);
  assert.equal(getAchievementStats(progress).bosses, 5);
  assert.equal(getAchievementProgress(progress).find(item => item.id === 'boss_hunter').unlocked, true);
});

test('full roster achievement unlocks when all campaign heroes are available', () => {
  let progress = createProgressState();
  for (let level = 1; level <= 6; level++) progress = recordLevelCompletion(progress, level);
  assert.equal(getAchievementProgress(progress).find(item => item.id === 'full_roster').unlocked, true);
});

test('star achievement total is capped to valid ratings from completed levels', () => {
  const progress = createProgressState({
    version: 1,
    completedLevels: [1, 2],
    starsByLevel: { 1: 3, 2: 3, 3: 3, 4: 999 },
    totalCoins: -5,
  });
  assert.equal(getAchievementStats(progress).stars, 6);
  assert.equal(getAchievementStats(progress).coins, 0);
});

test('achievement catalog has unique IDs and valid progress targets', () => {
  assert.equal(new Set(ACHIEVEMENTS.map(item => item.id)).size, ACHIEVEMENTS.length);
  assert.ok(ACHIEVEMENTS.every(item => Number.isInteger(item.target) && item.target > 0));
});
