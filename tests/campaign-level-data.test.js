import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const campaign = JSON.parse(await readFile(new URL('../src/data/levels-8-40.json', import.meta.url), 'utf8'));

test('campaign contains every level from 8 through 40 exactly once', () => {
  assert.equal(campaign.levels.length, 33);
  assert.deepEqual(campaign.levels.map(level => level.id), Array.from({ length: 33 }, (_, i) => i + 8));
});

test('level lengths, density, checkpoint counts and targets follow the campaign spec', () => {
  for (const level of campaign.levels) {
    assert.equal(level.length, 1200 + (level.id - 8) * 80);
    assert.ok(level.obstacleDensity >= 0.15 && level.obstacleDensity <= 0.55);
    assert.equal(level.obstacleDensity, Number((0.15 + ((level.id - 8) / 32) * 0.4).toFixed(4)));
    assert.ok(level.checkpoints === 3 || level.checkpoints === 4);
    assert.ok(level.enemies >= 2 && level.enemies <= 12);
    assert.ok(level.coins >= 30 && level.coins <= 120);
    assert.ok(level.gems >= 1 && level.gems <= 10);
    assert.ok(Array.isArray(level.obstacles) && level.obstacles.length >= 2);
    assert.ok(level.objective.length > 10);
    assert.ok(level.timerSeconds > 0);
  }
});

test('only levels 16, 24, 32 and 40 are boss encounters', () => {
  const bossLevels = campaign.levels.filter(level => level.boss).map(level => level.id);
  assert.deepEqual(bossLevels, [16, 24, 32, 40]);
  assert.deepEqual(campaign.generationRules.bossLevels, bossLevels);
});

test('final boss and completion rewards are fully specified', () => {
  const finalLevel = campaign.levels.at(-1);
  assert.equal(finalLevel.boss.name, 'Dark Overlord');
  assert.equal(finalLevel.boss.health, 300);
  assert.equal(finalLevel.boss.phases, 3);
  assert.ok(finalLevel.completion_reward.unlock.includes('Endless Mode'));
  assert.ok(finalLevel.completion_reward.unlock.includes('Hero Skin: Golden Champion'));
});
