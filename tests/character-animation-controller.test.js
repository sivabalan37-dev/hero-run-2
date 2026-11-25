import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CharacterAnimationController } from '../src/adventure/CharacterAnimationController.js';

function makeClip(name) {
  return new THREE.AnimationClip(name, 1, [
    new THREE.NumberKeyframeTrack('.position[x]', [0, 1], [0, 1]),
  ]);
}

test('animation controller indexes clips and cross-fades named actions', () => {
  const root = new THREE.Group();
  const controller = new CharacterAnimationController(root, [makeClip('Idle'), makeClip('Run')]);
  assert.equal(controller.hasClip('idle'), true);
  assert.equal(controller.hasClip('Run'), true);
  assert.deepEqual(controller.getClipNames(), ['Idle', 'Run']);
  assert.equal(controller.play('Idle'), true);
  assert.equal(controller.play('Run', { fade: 0.1 }), true);
  controller.update(1 / 60);
  assert.equal(controller.play('Missing'), false);
  controller.dispose();
  assert.equal(controller.play('Idle'), false);
});

test('animation controller supports one-shot overlay actions', () => {
  const root = new THREE.Group();
  const controller = new CharacterAnimationController(root, [makeClip('Run'), makeClip('Attack')]);
  assert.equal(controller.play('Run'), true);
  assert.equal(controller.play('Attack', { loop: false, layer: 'overlay' }), true);
  controller.update(0.05);
  controller.stopOverlay();
  controller.dispose();
  controller.dispose();
});
