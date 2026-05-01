// PROJECT A - Service Worker (para funcionalidade PWA)
// Este SW não gerencia mais alertas sonoros, apenas o funcionamento offline e instalação do PWA

const CACHE_NAME = 'project-a-v1';
const urlsToCache = [
  './',
  './index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Sem lógica de alertas - agora tudo é gerenciado pelo Google Calendar
