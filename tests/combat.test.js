import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ToyStarPool } from '../src/adventure/Combat.js';

function fakeEnemy(x = 2) {
  return {
    x,
    health: 2,
    hurtTimer: 0,
    alive: true,
    state: 'patrol',
    group: new THREE.Group(),
  };
}

test('Toy Star projectile hits and damages a Robo Bug once', () => {
  const scene = new THREE.Scene();
  const pool = new ToyStarPool(scene);
  const enemy = fakeEnemy(2);
  assert.equal(pool.fireToyStar(0, 1.28, 1), true);

  let hits = 0;
  for (let i = 0; i < 18; i++) {
    enemy.hurtTimer = Math.max(0, enemy.hurtTimer - 1 / 60);
    hits += pool.update(1 / 60, [enemy]).hits;
  }
  assert.equal(hits, 1);
  assert.equal(enemy.health, 1);
  assert.equal(enemy.alive, true);
  pool.destroy();
});

test('projectile pool refuses to exceed its fixed capacity', () => {
  const scene = new THREE.Scene();
  const pool = new ToyStarPool(scene);
  let accepted = 0;
  for (let i = 0; i < 13; i++) {
    if (pool.spawn(0, 1, 10, 0)) accepted++;
  }
  assert.equal(accepted, 12);
  assert.equal(pool.items.filter(item => item.active).length, 12);
  pool.destroy();
});

test('Star Burst fires a bounded spread of projectiles', () => {
  const pool = new ToyStarPool(new THREE.Scene());
  const fired = pool.fireStarBurst(0, 1, 1);
  assert.equal(fired, 7);
  assert.equal(pool.items.filter(item => item.active).length, 7);
  pool.destroy();
});
