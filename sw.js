const CACHE = 'snake-quiz-cache-v2';
const PRECACHE_ASSETS = [
  '/SnakeQuiz/icon.svg',
  '/SnakeQuiz/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const { request } = event;

  // Network-first for navigation requests to avoid serving stale HTML that references old asset names.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/SnakeQuiz/index.html');
        })
    );
    return;
  }

  // Cache-first for small pre-cached assets; everything else falls back to the network.
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
