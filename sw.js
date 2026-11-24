const CACHE_NAME = 'jiet-kapil-placement-v9';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './firebase-auth.js',
  './career-curriculum.js',
  './english-curriculum.js',
  './manifest.json',
  './assets/kapil_faceprep_banner.png',
  './assets/kapil_avatar.png',
  './assets/faceprep_logo.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('jiet-kapil-placement-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin === 'https://www.gstatic.com' && requestUrl.pathname.startsWith('/firebasejs/13.4.0/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          try { await cache.put(request, response.clone()); } catch (error) { /* Continue with network response. */ }
        }
        return response;
      })
    );
    return;
  }
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            try {
              const cache = await caches.open(CACHE_NAME);
              await cache.put('./index.html', response.clone());
            } catch (error) {
              // A cache quota issue should not turn a successful online page load into a failure.
            }
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('./index.html'))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then(async (response) => {
        if (response.ok) {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          } catch (error) {
            // Keep serving the network response if the browser declines to cache it.
          }
        }
        return response;
      });
    })
  );
});
