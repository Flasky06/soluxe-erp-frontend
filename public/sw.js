const CACHE_NAME = 'soluxe-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo/soluxe-logo.jpeg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Only handle same-origin requests — skip external URLs (e.g. Cloudflare analytics)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
