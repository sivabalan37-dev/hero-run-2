import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, game] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/adventure/AdventureGame.js', import.meta.url), 'utf8'),
]);

test('main menu exposes achievements and a back control', () => {
  assert.match(html, /id="achievements-button"/);
  assert.match(html, /id="achievements-panel"/);
  assert.match(html, /id="achievements-back"/);
});

test('achievement screen renders accessible progress bars and saved progress', () => {
  assert.match(game, /getAchievementProgress\(this\.progress\)/);
  assert.match(game, /role', 'progressbar'/);
  assert.match(game, /aria-valuenow/);
  assert.match(game, /Achievement unlocked:/);
});

test('achievement menu listeners are cleaned up when the game is destroyed', () => {
  assert.match(game, /addEventListener\('click', this\.onOpenAchievements\)/);
  assert.match(game, /removeEventListener\('click', this\.onOpenAchievements\)/);
  assert.match(game, /removeEventListener\('click', this\.onCloseAchievements\)/);
});
