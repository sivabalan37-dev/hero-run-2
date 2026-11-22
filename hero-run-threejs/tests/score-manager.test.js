import { describe, it, expect } from 'vitest';
import { ScoreManager } from '../src/game/ScoreManager.js';

describe('ScoreManager', () => {
  it('scores distance, coins, shards and enemies', () => {
    const score = new ScoreManager();
    score.updateDistance(12.7);
    score.addCoin(); score.addShard(); score.addKill();
    expect(score.distance).toBeCloseTo(12.7);
    expect(score.coins).toBe(1);
    expect(score.shards).toBe(1);
    expect(score.kills).toBe(1);
    expect(score.score).toBe(107);
  });
  it('resets all counters', () => {
    const score = new ScoreManager();
    score.updateDistance(50); score.addCoin(); score.reset();
    expect(score).toMatchObject({ score: 0, distance: 0, coins: 0, shards: 0, kills: 0 });
  });
  it('ignores negative distance increments', () => {
    const score = new ScoreManager();
    score.updateDistance(-10);
    expect(score.distance).toBe(0);
  });
});