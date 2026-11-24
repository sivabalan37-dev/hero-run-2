const CACHE_NAME = 'hero-run-time-travel-v2';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './.vite/manifest.json'];

async function getBuildAssets() {
  const response = await fetch('./.vite/manifest.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('Unable to load the production asset manifest');
  const manifest = await response.json();
  const assets = new Set();

  for (const entry of Object.values(manifest)) {
    if (typeof entry.file === 'string') assets.add(`./${entry.file}`);
    for (const file of entry.css || []) {
      if (typeof file === 'string') assets.add(`./${file}`);
    }
    for (const file of entry.assets || []) {
      if (typeof file === 'string') assets.add(`./${file}`);
    }
  }
  return [...assets];
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    const buildAssets = await getBuildAssets();
    if (buildAssets.length) await cache.addAll(buildAssets);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (request.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      throw error;
    }
  })());
});
