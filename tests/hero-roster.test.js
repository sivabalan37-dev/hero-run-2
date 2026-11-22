import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createHero, ShinHero, NobiHero, BenjiHero } from '../src/adventure/Hero.js';

test('hero factory creates the three distinct playable characters', () => {
  const scene = new THREE.Scene();
  const shin = createHero(scene, 'shin');
  const nobi = createHero(scene, 'nobi');
  const benji = createHero(scene, 'benji');
  assert.ok(shin instanceof ShinHero);
  assert.ok(nobi instanceof NobiHero);
  assert.ok(benji instanceof BenjiHero);
  assert.deepEqual([shin.characterId, nobi.characterId, benji.characterId], ['shin', 'nobi', 'benji']);
  assert.equal(scene.children.length, 3);
  shin.destroy(); nobi.destroy(); benji.destroy();
});

test('Nobi exposes glide ability', () => {
  const hero = new NobiHero(new THREE.Scene());
  assert.equal(hero.canGlide, true);
  hero.destroy();
});

test('Benji cycles through normal, Blaze, Shock and Titan forms', () => {
  const hero = new BenjiHero(new THREE.Scene());
  assert.equal(hero.forms[hero.formIndex], 'normal');
  assert.equal(hero.cycleForm(), 'blaze');
  assert.equal(hero.cycleForm(), 'shock');
  assert.equal(hero.cycleForm(), 'titan');
  assert.equal(hero.cycleForm(), 'normal');
  assert.equal(hero.visualScale, 1);
  hero.destroy();
});
