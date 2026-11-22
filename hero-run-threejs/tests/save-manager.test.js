import { describe, it, expect, vi, afterEach } from 'vitest';
import { SaveManager } from '../src/game/SaveManager.js';

afterEach(() => { vi.unstubAllGlobals(); });
describe('SaveManager', () => {
  it('stores numeric progress under the game namespace', () => {
    const store = new Map();
    vi.stubGlobal('localStorage', { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) });
    const save = new SaveManager();
    expect(save.setNumber('best-distance', 123)).toBe(true);
    expect(save.getNumber('best-distance')).toBe(123);
  });
  it('uses fallbacks when browser storage is unavailable', () => {
    vi.stubGlobal('localStorage', { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });
    const save = new SaveManager();
    expect(save.getNumber('coins', 7)).toBe(7);
    expect(save.setNumber('coins', 9)).toBe(false);
  });
});