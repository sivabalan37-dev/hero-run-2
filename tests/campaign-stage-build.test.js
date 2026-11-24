import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { SunnyNeighborhoodLevel } from '../src/adventure/SunnyNeighborhoodLevel.js';

function buildStage(levelNumber) {
  const scene = new THREE.Scene();
  const stage = new SunnyNeighborhoodLevel(scene, { levelNumber });
  return { scene, stage };
}

function disposeScene(scene) {
  scene.traverse(object => {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
    else object.material?.dispose();
  });
}

test('all forty campaign levels build playable stage structures', () => {
  for (let levelNumber = 1; levelNumber <= 40; levelNumber++) {
    const { scene, stage } = buildStage(levelNumber);
    try {
      assert.ok(stage.exitX > 0, `level ${levelNumber} has a positive exit position`);
      assert.ok(stage.checkpointX > 0 && stage.checkpointX < stage.exitX,
        `level ${levelNumber} checkpoint is before its exit`);
      assert.ok(stage.platforms.length >= 5, `level ${levelNumber} has a ground route and raised platforms`);

      const ground = stage.platforms[0];
      assert.ok(ground.solidSides, `level ${levelNumber} has a solid-sided ground route`);
      assert.ok(ground.x - ground.width / 2 <= 0, `level ${levelNumber} ground starts before the player`);
      assert.ok(ground.x + ground.width / 2 >= stage.exitX,
        `level ${levelNumber} ground reaches its exit`);

      assert.ok(stage.enemies.length >= 1, `level ${levelNumber} has an encounter`);
      const bosses = stage.enemies.filter(enemy => enemy.isBoss);
      assert.equal(bosses.length, stage.isBossLevel ? 1 : 0,
        `level ${levelNumber} has the expected boss count`);
      assert.ok(stage.collectibles.some(item => item.type === 'shard'),
        `level ${levelNumber} contains its Time Shard`);
      assert.ok(stage.collectibles.some(item => item.type === 'heart'),
        `level ${levelNumber} contains its recovery collectible`);
      for (const item of stage.collectibles) {
        assert.ok(Number.isFinite(item.x) && item.x >= 0 && item.x <= stage.exitX,
          `level ${levelNumber} collectible is within the stage`);
        assert.ok(Number.isFinite(item.y), `level ${levelNumber} collectible has a valid height`);
      }
    } finally {
      disposeScene(scene);
    }
  }
});
