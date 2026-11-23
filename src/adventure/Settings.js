const STORAGE_KEY = 'hero-run-settings-v1';

export const DEFAULT_SETTINGS = Object.freeze({
  soundEnabled: true,
  volume: 0.65,
  graphicsQuality: 'medium',
});

export function createSettingsState(value = {}) {
  const volume = Number(value?.volume);
  return {
    soundEnabled: typeof value?.soundEnabled === 'boolean'
      ? value.soundEnabled
      : DEFAULT_SETTINGS.soundEnabled,
    volume: Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : DEFAULT_SETTINGS.volume,
    graphicsQuality: ['low', 'medium', 'high'].includes(value?.graphicsQuality)
      ? value.graphicsQuality
      : DEFAULT_SETTINGS.graphicsQuality,
  };
}

export function loadSettings(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? createSettingsState(JSON.parse(raw)) : createSettingsState();
  } catch {
    return createSettingsState();
  }
}

export function saveSettings(value, storage = globalThis.localStorage) {
  try {
    const settings = createSettingsState(value);
    storage?.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
