import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { getImpactParticleVelocity, ImpactParticlePool } from '../src/adventure/ImpactParticles.js';

test('impact particle directions are deterministic and evenly distributed', () => {
  const vectors = Array.from({ length: 8 }, (_, i) => getImpactParticleVelocity(i, 8, 4));
  assert.deepEqual(vectors[0], getImpactParticleVelocity(0, 8, 4));
  assert.ok(vectors.every(v => Number.isFinite(v.x) && Number.isFinite(v.y)));
  assert.ok(vectors.some(v => v.y > 0) && vectors.some(v => v.y < 0));
});

test('normal and boss impacts activate bounded particle bursts', () => {
  const scene = new THREE.Scene();
  const pool = new ImpactParticlePool(scene, 24);
  assert.equal(pool.spawn(2, 1, false), 7);
  assert.equal(pool.items.filter(item => item.active).length, 7);
  pool.clear();
  assert.equal(pool.spawn(2, 1, true), 12);
  assert.equal(pool.items.filter(item => item.active).length, 12);
  pool.destroy();
  assert.equal(scene.children.length, 0);
});

test('impact particles expire and hide their pooled meshes', () => {
  const pool = new ImpactParticlePool(new THREE.Scene(), 8);
  pool.spawn(0, 0);
  pool.update(0.5);
  assert.equal(pool.items.filter(item => item.active).length, 0);
  assert.equal(pool.items.filter(item => item.mesh.visible).length, 0);
  pool.destroy();
});

test('impact burst spawning avoids temporary filtered arrays and velocity objects', () => {
  const pool = new ImpactParticlePool(new THREE.Scene(), 10);
  pool.items.filter = () => {
    throw new Error('spawn must not allocate an available-items array');
  };

  assert.equal(pool.spawn(1, 2, false), 7);
  assert.equal(pool.spawn(3, 4, false), 3);
  assert.equal(pool.items.reduce((count, item) => count + Number(item.active), 0), 10);
  assert.equal(pool.spawn(5, 6, true), 0);

  const finalBurst = pool.items.slice(7);
  for (let index = 0; index < finalBurst.length; index++) {
    const expected = getImpactParticleVelocity(index, 3, 3.8);
    assert.ok(Math.abs(finalBurst[index].vx - expected.x) < 1e-10);
    assert.ok(Math.abs(finalBurst[index].vy - expected.y) < 1e-10);
  }

  pool.destroy();
});

test('impact particle pool wraps its allocation cursor after particles expire', () => {
  const scene = new THREE.Scene();
  const pool = new ImpactParticlePool(scene, 8);
  assert.equal(pool.spawn(0, 0), 7);
  pool.update(0.5);
  assert.equal(pool.spawn(2, 3), 7);
  assert.equal(pool.items.reduce((count, item) => count + Number(item.active), 0), 7);
  pool.destroy();
  assert.equal(scene.children.length, 0);
});
