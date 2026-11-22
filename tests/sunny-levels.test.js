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
