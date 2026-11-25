import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSettingsState,
  loadSettings,
  saveSettings,
} from '../src/adventure/Settings.js';

test('settings use safe defaults and clamp invalid values', () => {
  assert.deepEqual(createSettingsState(), {
    soundEnabled: true,
    volume: 0.65,
    graphicsQuality: 'high',
  });
  assert.deepEqual(createSettingsState({
    soundEnabled: false,
    volume: 4,
    graphicsQuality: 'ultra',
  }), {
    soundEnabled: false,
    volume: 1,
    graphicsQuality: 'high',
  });
  assert.equal(createSettingsState({ volume: -2 }).volume, 0);
  assert.equal(createSettingsState({ graphicsQuality: 'auto' }).graphicsQuality, 'auto');
});

test('settings persist and reload from storage', () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  assert.equal(saveSettings({
    soundEnabled: false,
    volume: 0.3,
    graphicsQuality: 'high',
  }, storage), true);
  assert.deepEqual(loadSettings(storage), {
    soundEnabled: false,
    volume: 0.3,
    graphicsQuality: 'high',
  });
});

test('corrupt or unavailable settings storage falls back safely', () => {
  const corrupt = { getItem() { return '{bad json'; } };
  assert.equal(loadSettings(corrupt).graphicsQuality, 'high');
  const blocked = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  assert.equal(loadSettings(blocked).soundEnabled, true);
  assert.equal(saveSettings({ volume: 0.5 }, blocked), false);
});
