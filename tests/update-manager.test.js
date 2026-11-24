import test from 'node:test';
import assert from 'node:assert/strict';
import { UpdateManager } from '../src/update/UpdateManager.js';

class EventTargetMock {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }
  removeEventListener(type, callback) {
    this.listeners.get(type)?.delete(callback);
  }
  dispatch(type) {
    for (const callback of this.listeners.get(type) || []) callback();
  }
}

function makeWorker(state = 'installed') {
  const target = new EventTargetMock();
  return {
    state,
    messages: [],
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatch: target.dispatch.bind(target),
    postMessage(message) { this.messages.push(message); },
  };
}

function makeRegistration() {
  const target = new EventTargetMock();
  return {
    waiting: null,
    installing: null,
    updateCalls: 0,
    updateError: null,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatch: target.dispatch.bind(target),
    async update() {
      this.updateCalls++;
      if (this.updateError) throw this.updateError;
    },
  };
}

test('initialization reports the current release when no worker is waiting', async () => {
  const serviceWorker = new EventTargetMock();
  serviceWorker.controller = {};
  const registration = makeRegistration();
  const states = [];
  const manager = new UpdateManager({
    serviceWorker,
    onStateChange: state => states.push(state),
  });

  assert.equal(await manager.init(registration), true);
  assert.equal(manager.state, 'current');
  assert.match(manager.message, /up to date/i);
  manager.destroy();
  assert.ok(states.length > 0);
});

test('manual check asks the browser to look for a newer service worker', async () => {
  const serviceWorker = new EventTargetMock();
  serviceWorker.controller = {};
  const registration = makeRegistration();
  const manager = new UpdateManager({ serviceWorker });

  await manager.init(registration);
  assert.equal(await manager.checkForUpdates(), true);
  assert.equal(registration.updateCalls, 1);
  assert.equal(manager.state, 'current');
  manager.destroy();
});

test('a waiting release is shown and only activated after player approval', async () => {
  const serviceWorker = new EventTargetMock();
  serviceWorker.controller = {};
  const registration = makeRegistration();
  const waitingWorker = makeWorker();
  registration.waiting = waitingWorker;
  let reloads = 0;
  const manager = new UpdateManager({
    serviceWorker,
    reload: () => { reloads++; },
  });

  await manager.init(registration);
  assert.equal(manager.state, 'available');
  assert.equal(manager.applyUpdate(), true);
  assert.deepEqual(waitingWorker.messages, [{ type: 'SKIP_WAITING' }]);
  assert.equal(reloads, 0, 'page waits until the worker takes control');

  serviceWorker.dispatch('controllerchange');
  assert.equal(reloads, 1);
  manager.destroy();
});

test('updatefound tracks installation and exposes the waiting release', async () => {
  const serviceWorker = new EventTargetMock();
  serviceWorker.controller = {};
  const registration = makeRegistration();
  const manager = new UpdateManager({ serviceWorker });

  await manager.init(registration);
  const installingWorker = makeWorker('installing');
  registration.installing = installingWorker;
  registration.dispatch('updatefound');
  assert.equal(manager.state, 'downloading');

  installingWorker.state = 'installed';
  registration.waiting = installingWorker;
  installingWorker.dispatch('statechange');
  assert.equal(manager.state, 'available');
  manager.destroy();
});

test('failed update check returns a useful status without crashing the game', async () => {
  const serviceWorker = new EventTargetMock();
  serviceWorker.controller = {};
  const registration = makeRegistration();
  registration.updateError = new Error('offline');
  const manager = new UpdateManager({ serviceWorker });

  await manager.init(registration);
  assert.equal(await manager.checkForUpdates(), false);
  assert.equal(manager.state, 'error');
  assert.match(manager.message, /internet connection/i);
  manager.destroy();
});
