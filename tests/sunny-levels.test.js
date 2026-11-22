import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SunnyNeighborhoodLevel } from '../src/adventure/SunnyNeighborhoodLevel.js';

test('first Sunny Neighborhood level contains its required gameplay objects', () => {
  const scene = new THREE.Scene();
  const level = new SunnyNeighborhoodLevel(scene, { levelNumber: 1 });
  assert.ok(level.platforms.length >= 5);
  assert.ok(level.collectibles.some(item => item.type === 'shard'));
  assert.ok(level.collectibles.some(item => item.type === 'heart'));
  assert.equal(level.enemies.length, 2);
  assert.equal(level.checkpointX, 22);
  assert.equal(level.exitX, 40);
  level.destroy();
});

test('second level has a distinct layout and its own checkpoint and exit', () => {
  const scene = new THREE.Scene();
  const level = new SunnyNeighborhoodLevel(scene, { levelNumber: 2 });
  assert.equal(level.levelNumber, 2);
  assert.ok(level.platforms.length >= 6);
  assert.equal(level.enemies.length, 3);
  assert.equal(level.checkpointX, 24);
  assert.equal(level.exitX, 42);
  assert.ok(level.collectibles.some(item => item.type === 'shard' && item.x === 36));
  level.destroy();
});

test('hidden collectibles stay hidden until Gadget Vision reveals them', () => {
  const scene = new THREE.Scene();
  const level = new SunnyNeighborhoodLevel(scene, { levelNumber: 1 });
  const hidden = level.collectibles.filter(item => item.hidden);
  assert.equal(hidden.length, 1);
  assert.equal(hidden[0].group.visible, false);
  assert.equal(level.revealHidden(), 1);
  assert.equal(hidden[0].group.visible, true);
  assert.equal(level.revealHidden(), 0);
  level.destroy();
});


test('third level is a distinct dusk stage with a longer route and four enemies', () => {
  const scene = new THREE.Scene();
  const level = new SunnyNeighborhoodLevel(scene, { levelNumber: 3 });
  assert.equal(level.levelNumber, 3);
  assert.ok(level.platforms.length >= 7);
  assert.equal(level.enemies.length, 4);
  assert.equal(level.checkpointX, 26);
  assert.equal(level.exitX, 44);
  assert.ok(level.collectibles.some(item => item.type === 'shard' && item.x === 40));
  assert.ok(scene.background instanceof THREE.Color);
  level.destroy();
});

test('fourth level is a festival-themed longer stage with a checkpoint, shard and five enemies', () => {
  const scene = new THREE.Scene();
  const level = new SunnyNeighborhoodLevel(scene, { levelNumber: 4 });
  assert.equal(level.levelNumber, 4);
  assert.ok(level.platforms.length >= 8);
  assert.equal(level.enemies.length, 5);
  assert.equal(level.checkpointX, 30);
  assert.equal(level.exitX, 46);
  assert.ok(level.collectibles.some(item => item.type === 'shard' && item.x === 42.2));
  assert.ok(level.collectibles.some(item => item.type === 'heart'));
  assert.ok(scene.background instanceof THREE.Color);
  level.destroy();
});

test('fifth level is Riverside Park with a long route, checkpoint, shard and six enemies', () => {
  const scene = new THREE.Scene();
  const level = new SunnyNeighborhoodLevel(scene, { levelNumber: 5 });
  assert.equal(level.levelNumber, 5);
  assert.ok(level.platforms.length >= 8);
  assert.equal(level.enemies.length, 6);
  assert.equal(level.checkpointX, 34);
  assert.equal(level.exitX, 50);
  assert.ok(level.collectibles.some(item => item.type === 'shard' && item.x === 47.2));
  assert.ok(level.collectibles.some(item => item.type === 'heart'));
  assert.ok(scene.background instanceof THREE.Color);
  level.destroy();
});

test('sixth level is Clocktower Climb with a tall route, checkpoint, shard and seven enemies', () => {
  const scene = new THREE.Scene();
  const level = new SunnyNeighborhoodLevel(scene, { levelNumber: 6 });
  assert.equal(level.levelNumber, 6);
  assert.ok(level.platforms.length >= 8);
  assert.equal(level.enemies.length, 7);
  assert.equal(level.checkpointX, 38);
  assert.equal(level.exitX, 54);
  assert.ok(level.collectibles.some(item => item.type === 'shard' && item.x === 51.2));
  assert.ok(level.collectibles.some(item => item.type === 'heart'));
  assert.ok(scene.background instanceof THREE.Color);
  level.destroy();
});

test('seventh level is Rooftop Relay with raised platforms, checkpoint, shard and eight enemies', () => {
  const scene = new THREE.Scene();
  const level = new SunnyNeighborhoodLevel(scene, { levelNumber: 7 });
  assert.equal(level.levelNumber, 7);
  assert.ok(level.platforms.length >= 9);
  assert.equal(level.enemies.length, 8);
  assert.equal(level.checkpointX, 42);
  assert.equal(level.exitX, 58);
  assert.ok(level.collectibles.some(item => item.type === 'shard' && item.x === 55.2));
  assert.ok(level.collectibles.some(item => item.type === 'heart'));
  level.destroy();
});

test('all forty campaign stages build with unique world layouts, shards and five boss gates', () => {
  const bossLevels = [8, 16, 24, 32, 40];
  for (let levelNumber = 1; levelNumber <= 40; levelNumber++) {
    const scene = new THREE.Scene();
    const level = new SunnyNeighborhoodLevel(scene, { levelNumber });
    assert.equal(level.levelNumber, levelNumber);
    assert.ok(level.platforms.length >= 5, `level ${levelNumber} needs platforms`);
    assert.ok(level.collectibles.some(item => item.type === 'shard'), `level ${levelNumber} needs a shard`);
    assert.ok(level.enemies.length >= 1, `level ${levelNumber} needs enemies`);
    assert.ok(level.exitX > level.checkpointX, `level ${levelNumber} needs a reachable checkpoint`);
    assert.equal(level.isBossLevel, bossLevels.includes(levelNumber));
    if (level.isBossLevel) {
      assert.equal(level.enemies.length, 1);
      assert.equal(level.enemies[0].isBoss, true);
      assert.equal(level.enemies[0].health, 12);
      assert.equal(level.enemies[0].bossName, level.info.boss);
    }
    level.destroy();
  }
});

