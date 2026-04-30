// PROJECT A - Service Worker (Persistente com notificações)
// Configurado para funcionar mesmo com o app fechado ou tela bloqueada

let activeTimers = new Map();

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_ALERTS') {
    const { alerts } = event.data;
    
    for (const [id, timer] of activeTimers.entries()) {
      clearTimeout(timer);
      activeTimers.delete(id);
    }
    
    const now = Date.now();
    for (const alert of alerts) {
      const delay = alert.timestamp - now;
      if (delay > 0 && delay < 30 * 24 * 60 * 60 * 1000) {
        const timerId = setTimeout(() => {
          self.registration.showNotification(alert.title, {
            body: alert.body,
            icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="22" fill="%230a0a0a"/%3E%3Cdefs%3E%3CradialGradient id="r1" cx="50%25" cy="35%25" r="60%25"%3E%3Cstop offset="0%25" stop-color="%23f0f0f0"/%3E%3Cstop offset="30%25" stop-color="%23b0b0b0"/%3E%3Cstop offset="60%25" stop-color="%23d8d8d8"/%3E%3Cstop offset="100%25" stop-color="%23606060"/%3E%3C/radialGradient%3E%3CradialGradient id="r2" cx="50%25" cy="30%25" r="70%25"%3E%3Cstop offset="0%25" stop-color="%233a3a3a"/%3E%3Cstop offset="60%25" stop-color="%231a1a1a"/%3E%3Cstop offset="100%25" stop-color="%23080808"/%3E%3C/radialGradient%3E%3ClinearGradient id="lA" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23f0f0f0"/%3E%3Cstop offset="50%25" stop-color="%23c0c0c0"/%3E%3Cstop offset="100%25" stop-color="%23808080"/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx="50" cy="50" r="46" fill="url(%23r2)" stroke="url(%23r1)" stroke-width="4"/%3E%3Cpath d="M22 38 A30 30 0 0 1 78 38" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-linecap="round"/%3E%3Ctext x="50" y="68" text-anchor="middle" font-family="Georgia,serif" font-size="48" font-weight="bold" fill="url(%23lA)"%3EA%3C/text%3E%3C/svg%3E',
            badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="22" fill="%2300FFFF"/%3E%3Ctext x="50" y="68" text-anchor="middle" font-family="Georgia,serif" font-size="48" font-weight="bold" fill="black"%3EA%3C/text%3E%3C/svg%3E',
            vibrate: [500, 100, 500, 100, 800, 100, 500],
            requireInteraction: true,
            tag: alert.id,
            silent: false,
            priority: 'max'
          });
          activeTimers.delete(alert.id);
        }, delay);
        activeTimers.set(alert.id, timerId);
      }
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/index.html') && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('./');
        }
      })
  );
});
