import test from 'node:test';
import assert from 'node:assert/strict';
import { getBossHudModel } from '../src/adventure/BossHUD.js';

function boss(overrides = {}) {
  return {
    isBoss: true,
    bossName: 'Neighborhood Guardian',
    phase: 1,
    health: 12,
    maxHealth: 12,
    alive: true,
    bossMode: 'approach',
    attackLabel: 'GROUND SLAM',
    evadeHint: 'JUMP TO EVADE',
    ...overrides,
  };
}

test('boss HUD is hidden when no boss or a regular enemy is supplied', () => {
  assert.equal(getBossHudModel(null), null);
  assert.equal(getBossHudModel({ isBoss: false, health: 2 }), null);
});

test('boss HUD shows the name, phase and full health on approach', () => {
  const model = getBossHudModel(boss());
  assert.equal(model.name, 'Neighborhood Guardian');
  assert.equal(model.phaseText, 'PHASE 1');
  assert.equal(model.healthText, '12 / 12');
  assert.equal(model.healthPercent, 100);
  assert.equal(model.warning, false);
  assert.equal(model.statusText, '');
});

test('boss HUD calculates remaining health and phase two', () => {
  const model = getBossHudModel(boss({ phase: 2, health: 7.5 }));
  assert.equal(model.phaseText, 'PHASE 2');
  assert.equal(model.healthPercent, 63);
  assert.equal(model.healthText, '8 / 12');
});

test('boss HUD warning identifies the boss-specific move and evasion hint', () => {
  const model = getBossHudModel(boss({ bossMode: 'telegraph' }));
  assert.equal(model.warning, true);
  assert.equal(model.statusText, 'GROUND SLAM · JUMP TO EVADE!');
});

test('boss HUD identifies the active strike', () => {
  const model = getBossHudModel(boss({ bossMode: 'strike' }));
  assert.equal(model.warning, true);
  assert.equal(model.statusText, 'GROUND SLAM!');
});

test('boss HUD shows a defeated state and zero health', () => {
  const model = getBossHudModel(boss({ health: 0, alive: false, bossMode: 'defeated' }));
  assert.equal(model.healthPercent, 0);
  assert.equal(model.healthText, '0 / 12');
  assert.equal(model.defeated, true);
  assert.equal(model.warning, false);
  assert.equal(model.statusText, 'DEFEATED · PORTAL OPEN');
});

test('boss HUD clamps invalid health and phase values', () => {
  const model = getBossHudModel(boss({
    health: 99,
    maxHealth: 12,
    phase: 8,
    bossName: '   ',
  }));
  assert.equal(model.health, 12);
  assert.equal(model.healthPercent, 100);
  assert.equal(model.phaseText, 'PHASE 3');
  assert.equal(model.name, 'WORLD GUARDIAN');
});
