import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptResolutionScale, getRenderPixelRatio, getGraphicsPreset } from '../src/adventure/GraphicsQuality.js';

test('desktop quality presets respect the display pixel ratio', () => {
  assert.equal(getRenderPixelRatio({ quality: 'low', devicePixelRatio: 2 }), 1);
  assert.equal(getRenderPixelRatio({ quality: 'medium', devicePixelRatio: 2 }), 1.5);
  assert.equal(getRenderPixelRatio({ quality: 'high', devicePixelRatio: 3 }), 2);
});

test('coarse-pointer devices use a lower render resolution cap', () => {
  assert.equal(getRenderPixelRatio({
    quality: 'medium',
    devicePixelRatio: 3,
    coarsePointer: true,
  }), 1.25);
  assert.equal(getRenderPixelRatio({
    quality: 'high',
    devicePixelRatio: 3,
    coarsePointer: true,
  }), 1.5);
});

test('constrained devices receive a conservative cap even without pointer metadata', () => {
  assert.equal(getRenderPixelRatio({
    quality: 'high',
    devicePixelRatio: 3,
    deviceMemory: 4,
  }), 1.5);
  assert.equal(getRenderPixelRatio({
    quality: 'medium',
    devicePixelRatio: 2,
    hardwareConcurrency: 4,
  }), 1.25);
});

test('unknown quality and invalid display ratios fall back safely', () => {
  assert.equal(getRenderPixelRatio({ quality: 'ultra', devicePixelRatio: 0 }), 1);
  assert.equal(getRenderPixelRatio({ quality: 'unknown', devicePixelRatio: 2 }), 1.5);
});


test('graphics presets scale shadows and exposure with selected quality', () => {
  assert.equal(getGraphicsPreset('low').shadows, false);
  assert.equal(getGraphicsPreset('medium').shadowMapSize, 1024);
  assert.equal(getGraphicsPreset('high').shadowMapSize, 2048);
  assert.ok(getGraphicsPreset('high').toneMappingExposure > getGraphicsPreset('medium').toneMappingExposure);
  assert.deepEqual(getGraphicsPreset('unknown'), getGraphicsPreset('medium'));
});

test('Auto quality stays within its mobile resolution range', () => {
  assert.equal(getRenderPixelRatio({ quality: 'auto', devicePixelRatio: 3 }), 1);
  assert.equal(getRenderPixelRatio({ quality: 'auto', devicePixelRatio: 0.5 }), 0.6);
  assert.equal(getGraphicsPreset('auto').shadows, true);
});

test('Auto resolution lowers quickly under load and recovers gradually', () => {
  assert.equal(adaptResolutionScale(0.9, 25), 0.84);
  assert.equal(adaptResolutionScale(0.9, 20), 0.87);
  assert.equal(adaptResolutionScale(0.9, 12), 0.92);
  assert.equal(adaptResolutionScale(0.99, 12), 1);
  assert.equal(adaptResolutionScale(0.61, 30), 0.6);
});
