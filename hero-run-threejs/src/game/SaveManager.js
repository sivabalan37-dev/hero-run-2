const PREFIX = 'hero-run-kingdom-';
export class SaveManager {
  getNumber(key, fallback = 0) {
    try {
      const raw = globalThis.localStorage?.getItem(PREFIX + key);
      if (raw === null || raw === undefined) return fallback;
      const value = Number(raw);
      return Number.isFinite(value) && value >= 0 ? value : fallback;
    } catch { return fallback; }
  }
  setNumber(key, value) {
    try { globalThis.localStorage?.setItem(PREFIX + key, String(value)); return true; }
    catch { return false; }
  }
  getText(key, fallback = '') {
    try { return globalThis.localStorage?.getItem(PREFIX + key) ?? fallback; }
    catch { return fallback; }
  }
  setText(key, value) {
    try { globalThis.localStorage?.setItem(PREFIX + key, String(value)); return true; }
    catch { return false; }
  }
}