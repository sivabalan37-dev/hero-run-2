import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignLevelRuntime, isCampaignRunFailed, isCampaignRunComplete } from '../src/adventure/CampaignLevelRuntime.js';

test('every campaign level generates a finite spawn schedule and reachable finish', () => {
  for (let levelNumber = 8; levelNumber <= 40; levelNumber++) {
    const runtime = createCampaignLevelRuntime(levelNumber);
    assert.ok(runtime, `missing runtime for level ${levelNumber}`);
    assert.equal(runtime.totalDistance, 1200 + (levelNumber - 8) * 80);
    assert.equal(runtime.events.filter(event => event.type === 'coin').length, runtime.targets.coins);
    assert.equal(runtime.events.filter(event => event.type === 'gem').length, runtime.targets.gems);
    assert.equal(runtime.events.filter(event => event.type === 'enemy').length, runtime.targets.enemies);
    assert.equal(runtime.events.filter(event => event.type === 'checkpoint').length, runtime.level.checkpoints);
    assert.equal(runtime.events.at(-1).type, 'finish_portal');
    assert.equal(runtime.events.at(-1).distance, runtime.totalDistance);
    assert.ok(runtime.events.every(event => event.distance >= 0 && event.distance <= runtime.totalDistance));
    assert.ok(runtime.events.every((event, index, events) => index === 0 || events[index - 1].distance <= event.distance));
  }
});

test('boss schedules exist only for levels 16, 24, 32 and 40', () => {
  const bossLevels = [];
  for (let levelNumber = 8; levelNumber <= 40; levelNumber++) {
    if (createCampaignLevelRuntime(levelNumber).events.some(event => event.type === 'boss')) bossLevels.push(levelNumber);
  }
  assert.deepEqual(bossLevels, [16, 24, 32, 40]);
});

test('campaign run failure and completion rules enforce health, timer and boss gates', () => {
  assert.equal(isCampaignRunFailed({ levelNumber: 8, health: 0, distance: 300, elapsedSeconds: 10 }), true);
  assert.equal(isCampaignRunFailed({ levelNumber: 8, health: 1, distance: 300, elapsedSeconds: 999 }), true);
  assert.equal(isCampaignRunFailed({ levelNumber: 8, health: 1, distance: 300, elapsedSeconds: 10 }), false);
  assert.equal(isCampaignRunComplete({ levelNumber: 8, health: 1, distance: 1200 }), true);
  assert.equal(isCampaignRunComplete({ levelNumber: 16, health: 1, distance: 1840, bossDefeated: false }), false);
  assert.equal(isCampaignRunComplete({ levelNumber: 16, health: 1, distance: 1840, bossDefeated: true }), true);
});

test('spawn schedules are deterministic for the same level', () => {
  assert.deepEqual(createCampaignLevelRuntime(24), createCampaignLevelRuntime(24));
});
