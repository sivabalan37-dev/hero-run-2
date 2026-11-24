import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, styles, input] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/adventure/Input.js', import.meta.url), 'utf8'),
]);

test('mobile touch controls expose every supported gameplay action', () => {
  const actions = [...html.matchAll(/data-action="([^"]+)"/g)].map(match => match[1]);
  for (const action of ['left', 'right', 'jump', 'attack', 'special', 'switch', 'transform']) {
    assert.ok(actions.includes(action), `touch controls are missing ${action}`);
    assert.ok(input.includes(`'${action}'`), `input handler does not support ${action}`);
  }
  assert.match(html, /id="touch-controls"[^>]*class="touch-controls hidden"/);
  assert.match(html, /aria-label="Move left"/);
  assert.match(html, /aria-label="Move right"/);
  assert.match(html, /aria-label="Jump"/);
});

test('phone touch targets retain minimum dimensions in the compact layout', () => {
  assert.match(styles, /\.left-cluster button\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*48px;/s);
  assert.match(styles, /\.right-cluster button\s*\{[^}]*min-height:\s*48px;/s);
  assert.match(styles, /\.right-cluster\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(styles, /\.touch-cluster button\s*\{[^}]*touch-action:\s*none;/s);
});

test('touch controls are hidden on fine pointers and enabled for coarse pointers', () => {
  assert.match(styles, /@media\s*\(pointer:\s*fine\)[\s\S]*?\.touch-controls\s*\{\s*display:\s*none\s*!important;/);
  assert.match(input, /pointerdown/);
  assert.match(input, /pointerup/);
  assert.match(input, /pointercancel/);
  assert.match(input, /lostpointercapture/);
});
