import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, game] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/adventure/AdventureGame.js', import.meta.url), 'utf8'),
]);

test('main menu exposes one rewards and title selection screen', () => {
  assert.match(html, /id="rewards-button"/);
  assert.match(html, /id="rewards-panel"/);
  assert.match(html, /id="rewards-back"/);
  assert.equal((html.match(/id="hero-title"/g) || []).length, 1);
  assert.doesNotMatch(html, /id="titles-button"|id="titles-panel"/);
});

test('reward screen enables only earned titles and persists the selection', () => {
  assert.match(game, /getTitleRewards\(this\.progress\)/);
  assert.match(game, /selectAchievementTitle\(this\.progress, reward\.id\)/);
  assert.match(game, /getEquippedTitle\(this\.progress\)/);
  assert.match(game, /REMOVE EQUIPPED TITLE/);
});

test('reward menu listeners are removed when the game is destroyed', () => {
  assert.match(game, /addEventListener\('click', this\.onOpenRewards\)/);
  assert.match(game, /removeEventListener\('click', this\.onOpenRewards\)/);
  assert.match(game, /removeEventListener\('click', this\.onCloseRewards\)/);
});
