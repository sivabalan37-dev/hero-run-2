import test from 'node:test';
import assert from 'node:assert/strict';
import { getBossAttackProfile, getBossPhase, initializeBoss, stepBoss } from '../src/adventure/BossAI.js';

function makeBoss(overrides = {}) {
  return initializeBoss({
    x: 0, minX: -5, maxX: 5, direction: 1, health: 12, maxHealth: 12,
    alive: true, attackCooldown: 0, ...overrides,
  });
}

test('boss phase changes at two health thresholds', () => {
  const boss = makeBoss();
  assert.equal(getBossPhase(boss).phase, 1);
  boss.health = 7.9;
  assert.equal(getBossPhase(boss).phase, 2);
  boss.health = 3;
  assert.equal(getBossPhase(boss).phase, 3);
});

test('boss telegraphs before striking and then enters recovery', () => {
  const boss = makeBoss();
  stepBoss(boss, { x: 1, y: 0 }, 1 / 60);
  assert.equal(boss.bossMode, 'telegraph');
  assert.equal(boss.attackPulse, false);
  for (let i = 0; i < 43; i++) stepBoss(boss, { x: 1, y: 0 }, 1 / 60);
  assert.equal(boss.bossMode, 'telegraph');
  stepBoss(boss, { x: 1, y: 0 }, 1 / 60);
  assert.equal(boss.bossMode, 'strike');
  assert.equal(boss.attackPulse, true);
  stepBoss(boss, { x: 1, y: 0 }, 1 / 60);
  assert.equal(boss.bossMode, 'recover');
  assert.equal(boss.attackPulse, false);
});

test('boss strike misses a hero outside its range or above the attack lane', () => {
  const boss = makeBoss();
  stepBoss(boss, { x: 1, y: 0 }, 1 / 60);
  for (let i = 0; i < 50; i++) stepBoss(boss, { x: 9, y: 4 }, 1 / 60);
  assert.equal(boss.attackPulse, false);
});

test('boss movement and attack cadence increase in later phases', () => {
  const boss = makeBoss({ health: 3 });
  const phase = getBossPhase(boss);
  assert.equal(phase.phase, 3);
  assert.ok(phase.chargeSpeed > getBossPhase(makeBoss()).chargeSpeed);
  assert.ok(phase.cooldown < getBossPhase(makeBoss()).cooldown);
});

test('defeated boss cannot attack again', () => {
  const boss = makeBoss({ health: 0, alive: false });
  stepBoss(boss, { x: 1, y: 0 }, 1 / 60);
  assert.equal(boss.bossMode, 'defeated');
  assert.equal(boss.attackPulse, false);
});

test('boss hit-stun timer recovers so later projectiles can hit', () => {
  const boss = makeBoss({ hurtTimer: 0.24 });
  stepBoss(boss, { x: 4, y: 0 }, 0.05);
  assert.ok(boss.hurtTimer < 0.24);
  for (let i = 0; i < 5; i++) stepBoss(boss, { x: 4, y: 0 }, 0.05);
  assert.equal(boss.hurtTimer, 0);
});

test('all five world bosses have distinct attack identities and tells', () => {
  const names = [
    'Neighborhood Guardian',
    'Mechanical Headmaster',
    'Toy Forest Guardian',
    'Supreme Machine',
    'Ultimate Time Guardian',
  ];
  const profiles = names.map(getBossAttackProfile);
  assert.equal(new Set(profiles.map(profile => profile.type)).size, 5);
  assert.equal(new Set(profiles.map(profile => profile.label)).size, 5);
  assert.ok(profiles.every(profile => profile.attackRange > 0 && profile.triggerRange >= profile.attackRange));
});

test('boss-specific strike envelopes have their own distance and jump windows', () => {
  const cases = [
    ['Neighborhood Guardian', 3.2, 0.6, true],
    ['Neighborhood Guardian', 3.2, 1.4, false],
    ['Mechanical Headmaster', 1.9, 1.5, true],
    ['Toy Forest Guardian', 3.5, 2.4, true],
    ['Supreme Machine', 4.5, 1.2, true],
    ['Ultimate Time Guardian', 5.0, 0.7, true],
  ];

  for (const [bossName, heroX, heroY, expectedHit] of cases) {
    const boss = makeBoss({ bossName });
    let pulse = false;
    for (let i = 0; i < 180 && !pulse; i++) {
      stepBoss(boss, { x: heroX, y: heroY }, 1 / 60);
      pulse = boss.attackPulse;
    }
    assert.equal(pulse, expectedHit, `${bossName} envelope at hero y=${heroY}`);
  }
});
