// PROJECT A - Service Worker (Versão Corrigida para Instalação)

const CACHE_NAME = 'project-a-v1';
const urlsToCache = [
  './',
  './index.html'
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cache aberto');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Ativado e controlando página');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Sistema de agendamento de alertas (simplificado mas funcional)
let alertTimers = {};

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_ALERTS') {
    console.log('[SW] Recebendo alertas para agendar:', event.data.alerts?.length);
    
    // Cancela timers antigos
    for (let id in alertTimers) {
      clearTimeout(alertTimers[id]);
      delete alertTimers[id];
    }
    
    const now = Date.now();
    for (const alert of event.data.alerts) {
      const delay = alert.timestamp - now;
      if (delay > 0 && delay < 30 * 24 * 60 * 60 * 1000) {
        console.log(`[SW] Agendando alerta para ${alert.title} em ${Math.round(delay/1000)}s`);
        alertTimers[alert.id] = setTimeout(() => {
          console.log('[SW] DISPARANDO NOTIFICAÇÃO:', alert.title);
          self.registration.showNotification(alert.title, {
            body: alert.body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [500, 200, 500],
            requireInteraction: true,
            tag: alert.id
          });
          delete alertTimers[alert.id];
        }, delay);
      }
    }
  }
});
