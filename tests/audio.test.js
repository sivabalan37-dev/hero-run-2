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

test('audio manager closes and detaches its Web Audio context during teardown', async () => {
  const previousWindow = globalThis.window;
  let closeCalls = 0;
  const context = {
    state: 'running',
    async resume() {},
    close() {
      closeCalls++;
      this.state = 'closed';
      return Promise.resolve();
    },
  };
  globalThis.window = {
    AudioContext: class {
      constructor() { return context; }
    },
  };

  try {
    const audio = new AudioManager();
    await audio.resume();
    assert.equal(audio.context, context);

    audio.destroy();
    assert.equal(audio.context, null);
    await Promise.resolve();
    assert.equal(closeCalls, 1);

    audio.destroy();
    assert.equal(closeCalls, 1, 'repeated teardown must not close the context twice');
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('audio teardown does not throw if the browser context close fails', () => {
  const audio = new AudioManager();
  let closeCalls = 0;
  audio.context = {
    state: 'running',
    close() {
      closeCalls++;
      throw new Error('context already unavailable');
    },
  };

  assert.doesNotThrow(() => audio.destroy());
  assert.equal(audio.context, null);
  assert.equal(closeCalls, 1);
});
