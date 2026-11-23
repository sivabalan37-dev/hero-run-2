import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, input] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/adventure/Input.js', import.meta.url), 'utf8'),
]);

test('tutorial explains every keyboard action supported by game input', () => {
  for (const key of ['ArrowLeft', 'ArrowRight', 'Space', 'KeyJ', 'KeyK', 'KeyC', 'KeyT']) {
    assert.ok(input.includes(`'${key}'`), `missing input mapping for ${key}`);
  }
  for (const label of ['A / D or ← / →', 'Space, W or ↑', 'J · Toy Star', 'K · Hero ability', 'C', 'T']) {
    assert.ok(html.includes(label), `tutorial is missing control label: ${label}`);
  }
});

test('tutorial includes hero guidance, star conditions and mobile controls', () => {
  for (const phrase of ['Shin:', 'Nobi:', 'Benji:', 'Time Shard', '75 health', 'on-screen arrows', 'tutorial-panel']) {
    assert.ok(html.includes(phrase), `tutorial is missing: ${phrase}`);
  }
});

test('tutorial menu has a reachable button and back control', () => {
  assert.match(html, /id="tutorial-button"/);
  assert.match(html, /id="tutorial-back"/);
  assert.match(html, /id="tutorial-panel"/);
});
