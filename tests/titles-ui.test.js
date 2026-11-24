import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, game] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/adventure/AdventureGame.js', import.meta.url), 'utf8'),
]);

test('main menu exposes rewards and title selection controls', () => {
  assert.match(html, /id="titles-button"/);
  assert.match(html, /id="titles-panel"/);
  assert.match(html, /id="titles-back"/);
  assert.match(html, /id="hero-title"/);
});

test('title screen only enables earned rewards and supports equipping', () => {
  assert.match(game, /getTitleOptions\(this\.progress\)/);
  assert.match(game, /button\.disabled = !item\.unlocked/);
  assert.match(game, /selectTitle\(this\.progress, titleId\)/);
  assert.match(game, /getEquippedTitle\(this\.progress\)/);
});

test('title menu listeners are removed when the game is destroyed', () => {
  assert.match(game, /addEventListener\('click', this\.onOpenTitles\)/);
  assert.match(game, /removeEventListener\('click', this\.onOpenTitles\)/);
  assert.match(game, /removeEventListener\('click', this\.onCloseTitles\)/);
});
