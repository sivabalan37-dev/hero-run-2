import test from 'node:test';
import assert from 'node:assert/strict';
import { getRenderPixelRatio } from '../src/adventure/GraphicsQuality.js';

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
