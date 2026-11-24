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
      if (levelNumber >= 8) {
        assert.ok(stage.group.children.some(object => object.position.x >= stage.exitX + 8),
          `level ${levelNumber} has background scenery near its far end`);
      }
      assert.ok(stage.checkpointX > 0 && stage.checkpointX < stage.exitX,
        `level ${levelNumber} checkpoint is before its exit`);
      assert.ok(stage.platforms.length >= 5, `level ${levelNumber} has a ground route and raised platforms`);

      if (levelNumber >= 8) {
        const raised = stage.platforms.filter(platform => !platform.solidSides)
          .sort((a, b) => a.x - b.x);
        for (let i = 1; i < raised.length; i++) {
          const previous = raised[i - 1];
          const current = raised[i];
          const edgeGap = current.x - current.width / 2 - (previous.x + previous.width / 2);
          assert.ok(edgeGap <= 3.01,
            `level ${levelNumber} raised platforms have a reachable horizontal gap`);
          assert.ok(Math.abs((current.y + current.height) - (previous.y + previous.height)) <= 0.51,
            `level ${levelNumber} raised platform heights change gradually`);
        }
      }

      const ground = stage.platforms[0];
      assert.ok(ground.solidSides, `level ${levelNumber} has a solid-sided ground route`);
      assert.ok(ground.x - ground.width / 2 <= 0, `level ${levelNumber} ground starts before the player`);
      assert.ok(ground.x + ground.width / 2 >= stage.exitX,
        `level ${levelNumber} ground reaches its exit`);

      assert.ok(stage.enemies.length >= 1, `level ${levelNumber} has an encounter`);
      for (const enemy of stage.enemies) {
        assert.ok(enemy.minX >= 0 && enemy.maxX <= stage.exitX,
          `level ${levelNumber} enemy patrol remains inside the stage`);
        assert.ok(enemy.minX <= enemy.x && enemy.x <= enemy.maxX,
          `level ${levelNumber} enemy starts inside its patrol bounds`);
      }
      const patrols = stage.enemies.filter(enemy => !enemy.isBoss)
        .sort((a, b) => a.minX - b.minX);
      for (let i = 1; i < patrols.length; i++) {
        assert.ok(patrols[i].minX - patrols[i - 1].maxX >= 1.5,
          `level ${levelNumber} regular enemy patrols have room between them`);
      }
      const bosses = stage.enemies.filter(enemy => enemy.isBoss);
      if (stage.isBossLevel) {
        const boss = bosses[0];
        assert.ok(boss.minX >= stage.checkpointX && boss.maxX < stage.exitX,
          `level ${levelNumber} boss patrol stays inside the checkpoint-to-exit arena`);
      }
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
        if (levelNumber >= 8 && item.type === 'coin' && !item.hidden && item.y > 1.8) {
          const supportedPlatform = stage.platforms.some(platform =>
            !platform.solidSides
            && Math.abs(item.x - platform.x) <= platform.width / 2 + 0.75
            && Math.abs(item.y - Math.max(2.45, platform.y + platform.height + 0.65)) <= 0.05
          );
          assert.ok(supportedPlatform,
            `level ${levelNumber} elevated coin is positioned over a reachable platform`);
        }
      }
    } finally {
      disposeScene(scene);
    }
  }
});
