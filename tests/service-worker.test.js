import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const CACHE_NAME = 'hero-run-time-travel-v2';
const ORIGIN = 'https://hero-run.test';
const workerSource = await readFile(new URL('../public/service-worker.js', import.meta.url), 'utf8');

function response(id) {
  return { ok: true, type: 'basic', id, clone() { return response(id); } };
}

function createWorker(manifest = {}) {
  const listeners = new Map();
  const cacheData = new Map();
  let fetchImplementation = async url => {
    if (url === './.vite/manifest.json') {
      return { ok: true, async json() { return manifest; } };
    }
    return response(String(url));
  };

  const keyFor = request => new URL(
    typeof request === 'string' ? request : request.url,
    ORIGIN
  ).href;

  const caches = {
    async open(name) {
      if (!cacheData.has(name)) cacheData.set(name, new Map());
      const data = cacheData.get(name);
      return {
        async addAll(requests) {
          for (const request of requests) data.set(keyFor(request), response(keyFor(request)));
        },
        async put(request, value) {
          data.set(keyFor(request), value);
        },
        async match(request) {
          return data.get(keyFor(request));
        },
      };
    },
    async keys() {
      return [...cacheData.keys()];
    },
    async delete(name) {
      return cacheData.delete(name);
    },
    async match(request) {
      const key = keyFor(request);
      for (const data of cacheData.values()) {
        if (data.has(key)) return data.get(key);
      }
      return undefined;
    },
  };

  const self = {
    location: { origin: ORIGIN },
    clients: { async claim() {} },
    async skipWaiting() {},
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
  };

  vm.runInNewContext(workerSource, {
    self,
    caches,
    URL,
    fetch: (...args) => fetchImplementation(...args),
  });

  return {
    listeners,
    cacheData,
    setFetch(callback) { fetchImplementation = callback; },
    async dispatchInstall() {
      let pending;
      listeners.get('install')({ waitUntil(value) { pending = value; } });
      await pending;
    },
    async dispatchActivate() {
      let pending;
      listeners.get('activate')({ waitUntil(value) { pending = value; } });
      await pending;
    },
    async dispatchFetch(request) {
      let pending;
      listeners.get('fetch')({
        request,
        respondWith(value) { pending = value; },
      });
      return pending ? await pending : undefined;
    },
  };
}

const productionManifest = {
  'index.html': { file: 'index.html' },
  'src/main.js': {
    file: 'assets/index-entry.js',
    css: ['assets/index.css'],
    isEntry: true,
    dynamicImports: ['src/adventure/AdventureGame.js'],
  },
  'src/adventure/AdventureGame.js': {
    file: 'assets/AdventureGame.js',
    imports: ['_three-vendor.js'],
  },
  '_three-vendor.js': { file: 'assets/three-vendor.js' },
};

test('service-worker install pre-caches every built script and stylesheet', async () => {
  const worker = createWorker(productionManifest);
  worker.cacheData.set('hero-run-time-travel-v1', new Map());

  await worker.dispatchInstall();

  const cache = worker.cacheData.get(CACHE_NAME);
  assert.ok(cache);
  for (const path of [
    'index.html',
    'manifest.webmanifest',
    '.vite/manifest.json',
    'assets/index-entry.js',
    'assets/index.css',
    'assets/AdventureGame.js',
    'assets/three-vendor.js',
  ]) {
    assert.ok(cache.has(new URL(path, ORIGIN).href), `expected ${path} to be cached`);
  }

  await worker.dispatchActivate();
  assert.equal(worker.cacheData.has('hero-run-time-travel-v1'), false);
});

test('runtime same-origin GET assets are cached and served when offline', async () => {
  const worker = createWorker(productionManifest);
  await worker.dispatchInstall();

  let networkCalls = 0;
  worker.setFetch(async request => {
    networkCalls++;
    return response(typeof request === 'string' ? request : request.url);
  });

  const request = {
    url: `${ORIGIN}/assets/late-loaded-font.woff2`,
    method: 'GET',
    mode: 'cors',
  };
  const online = await worker.dispatchFetch(request);
  assert.equal(online.id, request.url);
  assert.equal(networkCalls, 1);

  worker.setFetch(async () => {
    networkCalls++;
    throw new Error('offline');
  });
  const offline = await worker.dispatchFetch(request);
  assert.equal(offline.id, request.url);
  assert.equal(networkCalls, 1, 'cached response should avoid another network request');
});

test('service worker leaves external and non-GET requests alone', async () => {
  const worker = createWorker(productionManifest);
  await worker.dispatchInstall();

  const external = await worker.dispatchFetch({
    url: 'https://cdn.example.test/file.js',
    method: 'GET',
    mode: 'cors',
  });
  assert.equal(external, undefined);

  const post = await worker.dispatchFetch({
    url: `${ORIGIN}/submit`,
    method: 'POST',
    mode: 'cors',
  });
  assert.equal(post, undefined);
});

test('offline navigation falls back to the cached app shell', async () => {
  const worker = createWorker(productionManifest);
  await worker.dispatchInstall();
  worker.setFetch(async () => { throw new Error('offline'); });

  const result = await worker.dispatchFetch({
    url: `${ORIGIN}/offline-route`,
    method: 'GET',
    mode: 'navigate',
  });
  assert.equal(result.id, new URL('./index.html', ORIGIN).href);
});
