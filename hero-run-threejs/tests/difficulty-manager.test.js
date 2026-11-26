import { describe, it, expect } from 'vitest';
import { DifficultyManager } from '../src/game/DifficultyManager.js';
import { CONFIG } from '../src/config/gameConfig.js';

describe('DifficultyManager', () => {
  it('starts at the configured base speed', () => {
    const game = new DifficultyManager();
    expect(game.update(0)).toBe(CONFIG.baseSpeed);
  });
  it('increases speed and caps it at the maximum', () => {
    const game = new DifficultyManager();
    game.update(12);
    expect(game.speed).toBeGreaterThan(CONFIG.baseSpeed);
    for (let i = 0; i < 1000; i += 1) game.update(1);
    expect(game.speed).toBe(CONFIG.maxSpeed);
  });
  it('makes spawns more frequent but keeps a safe lower bound', () => {
    const game = new DifficultyManager();
    const early = game.spawnInterval;
    game.update(80);
    expect(game.spawnInterval).toBeLessThan(early);
    expect(game.spawnInterval).toBeGreaterThanOrEqual(1.05);
  });
});