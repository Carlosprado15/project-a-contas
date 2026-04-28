self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Estratégia básica de fetch para PWA
  e.respondWith(fetch(e.request));
});
