import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const inputSource = await readFile(
  new URL('../src/adventure/Input.js', import.meta.url),
  'utf8'
);

function makeTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    removeEventListener(type, callback) {
      listeners.set(type, (listeners.get(type) || []).filter(item => item !== callback));
    },
    dispatch(type, event = {}) {
      for (const callback of listeners.get(type) || []) callback(event);
    },
    contains() { return true; },
  };
}

function makeButton(action) {
  const classes = new Set();
  return {
    dataset: { action },
    classList: {
      add(value) { classes.add(value); },
      remove(value) { classes.delete(value); },
      contains(value) { return classes.has(value); },
    },
    setPointerCapture() {},
    closest(selector) { return selector === '[data-action]' ? this : null; },
  };
}

function createInput() {
  const root = makeTarget();
  const windowTarget = makeTarget();
  const context = { window: windowTarget, Map, Set, Number };
  vm.runInNewContext(
    inputSource.replace('export class AdventureInput', 'class AdventureInput') +
      '\nglobalThis.AdventureInput = AdventureInput;',
    context
  );
  const input = new context.AdventureInput(root);
  return { input, root, windowTarget };
}

function pointerEvent(button, pointerId) {
  return {
    target: button,
    pointerId,
    preventDefault() { this.defaultPrevented = true; },
  };
}

test('keyboard aliases map to movement and jump actions', () => {
  const { input, windowTarget } = createInput();
  let prevented = false;

  windowTarget.dispatch('keydown', {
    code: 'ArrowLeft',
    preventDefault() { prevented = true; },
  });
  assert.equal(input.movement(), -1);
  assert.equal(input.wasPressed('left'), true);
  assert.equal(prevented, true);

  input.endStep();
  windowTarget.dispatch('keydown', { code: 'KeyA', preventDefault() {} });
  assert.equal(input.movement(), -1);
  assert.equal(input.wasPressed('left'), false, 'holding an alias must not create a second press');

  windowTarget.dispatch('keyup', { code: 'ArrowLeft' });
  assert.equal(input.movement(), -1, 'the second held alias must keep movement active');
  windowTarget.dispatch('keyup', { code: 'KeyA' });
  assert.equal(input.movement(), 0);

  windowTarget.dispatch('keydown', { code: 'Space', preventDefault() {} });
  assert.equal(input.isDown('jump'), true);
  assert.equal(input.consumePressed('jump'), true);
  assert.equal(input.consumePressed('jump'), false);
  input.destroy();
});

test('independent touch pointers can hold opposite directions together', () => {
  const { input, root } = createInput();
  const left = makeButton('left');
  const right = makeButton('right');

  root.dispatch('pointerdown', pointerEvent(left, 1));
  root.dispatch('pointerdown', pointerEvent(right, 2));
  assert.equal(input.movement(), 0);
  assert.equal(left.classList.contains('pressed'), true);
  assert.equal(right.classList.contains('pressed'), true);

  root.dispatch('pointerup', { pointerId: 1 });
  assert.equal(input.movement(), 1);
  assert.equal(left.classList.contains('pressed'), false);
  assert.equal(right.classList.contains('pressed'), true);

  root.dispatch('pointercancel', { pointerId: 2 });
  assert.equal(input.movement(), 0);
  assert.equal(right.classList.contains('pressed'), false);
  input.destroy();
});

test('releasing one of multiple pointers for the same action clears only its button', () => {
  const { input, root } = createInput();
  const first = makeButton('jump');
  const second = makeButton('jump');

  root.dispatch('pointerdown', pointerEvent(first, 11));
  root.dispatch('pointerdown', pointerEvent(second, 12));
  root.dispatch('pointerup', { pointerId: 11 });

  assert.equal(input.isDown('jump'), true);
  assert.equal(first.classList.contains('pressed'), false);
  assert.equal(second.classList.contains('pressed'), true);

  root.dispatch('pointerup', { pointerId: 12 });
  assert.equal(input.isDown('jump'), false);
  assert.equal(second.classList.contains('pressed'), false);
  input.destroy();
});

test('window blur clears held keys, pointers and visual pressed states', () => {
  const { input, root, windowTarget } = createInput();
  const jump = makeButton('jump');
  root.dispatch('pointerdown', pointerEvent(jump, 21));
  windowTarget.dispatch('keydown', { code: 'KeyD', preventDefault() {} });

  windowTarget.dispatch('blur');
  assert.equal(input.movement(), 0);
  assert.equal(input.isDown('jump'), false);
  assert.equal(jump.classList.contains('pressed'), false);
  assert.equal(input.wasPressed('jump'), false);
  input.destroy();
});

test('destroy removes listeners and clears held input state', () => {
  const { input, root, windowTarget } = createInput();
  const right = makeButton('right');
  root.dispatch('pointerdown', pointerEvent(right, 31));
  input.destroy();

  assert.equal(input.movement(), 0);
  assert.equal(right.classList.contains('pressed'), false);
  assert.equal((root.listeners.get('pointerdown') || []).length, 0);
  assert.equal((windowTarget.listeners.get('keydown') || []).length, 0);
});
