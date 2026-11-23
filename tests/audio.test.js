import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioManager } from '../src/game/Audio.js';

test('audio manager applies default and bounded volume settings', () => {
  const audio = new AudioManager();
  assert.equal(audio.enabled, true);
  assert.equal(audio.volume, 0.65);
  audio.setVolume(1.7);
  assert.equal(audio.volume, 1);
  audio.setVolume(-0.4);
  assert.equal(audio.volume, 0);
  audio.setVolume(Number.NaN);
  assert.equal(audio.volume, 0);
});

test('audio can be muted and re-enabled without replacing its volume', () => {
  const audio = new AudioManager({ enabled: false, volume: 0.4 });
  audio.setEnabled(true);
  assert.equal(audio.enabled, true);
  assert.equal(audio.volume, 0.4);
  audio.setEnabled(false);
  assert.equal(audio.enabled, false);
  assert.equal(audio.volume, 0.4);
});

test('muted audio does not try to create an audio context on resume', async () => {
  const audio = new AudioManager({ enabled: false });
  await audio.resume();
  assert.equal(audio.context, null);
});
