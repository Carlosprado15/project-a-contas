// ================================================================
// PROJECT A — Service Worker v3.0
// Notificações em segundo plano com Firebase FCM
// ================================================================

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Inicializar Firebase no SW
firebase.initializeApp({
  apiKey: "AIzaSyC_u2ts4nEyRqLOiX-ndExzlnzbTnd-Knw",
  authDomain: "project-a-finance.firebaseapp.com",
  projectId: "project-a-finance",
  messagingSenderId: "224735203940",
  appId: "1:224735203940:web:3b3986ab8f27ed21a58571"
});

const messaging = firebase.messaging();

// ── Estado interno do SW ──
let bills     = [];
let eveTime   = '21:00';
let dueTime   = '09:00';
let firedAlerts = new Set();
let checkInterval = null;

// ================================================================
// RECEBER MENSAGENS DO APP (sincronização de contas)
// ================================================================
self.addEventListener('message', e => {
  if (!e.data) return;

  if (e.data.type === 'SYNC_BILLS') {
    bills       = e.data.bills       || [];
    eveTime     = e.data.eveTime     || '21:00';
    dueTime     = e.data.dueTime     || '09:00';
    firedAlerts = new Set(e.data.firedAlerts || []);
    // Iniciar verificação periódica
    startChecking();
  }

  if (e.data.type === 'SCHEDULE_CHECK') {
    checkDueAlerts();
  }
});

// ================================================================
// VERIFICAÇÃO PERIÓDICA — a cada 60 segundos
// ================================================================
function startChecking() {
  if (checkInterval) clearInterval(checkInterval);
  checkInterval = setInterval(checkDueAlerts, 60000);
  checkDueAlerts(); // checar imediatamente
}

function checkDueAlerts() {
  if (!bills.length) return;

  const now   = new Date();
  const hhmm  = pad(now.getHours()) + ':' + pad(now.getMinutes());
  const today = toDateStr(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toDateStr(tomorrow);

  // — Pré-aviso véspera —
  if (hhmm === eveTime) {
    bills
      .filter(b => b.dueDate === tomorrowStr)
      .forEach(b => {
        const key = b.id + '_eve_' + today;
        if (!firedAlerts.has(key)) {
          firedAlerts.add(key);
          showNotification(
            '⏰ Vence AMANHÃ — ' + b.name,
            'Valor: ' + fmtAmt(b.amount) + ' · Vence em ' + fmtDate(b.dueDate),
            b.id
          );
        }
      });
  }

  // — Aviso do dia —
  if (hhmm === dueTime) {
    bills
      .filter(b => b.dueDate === today)
      .forEach(b => {
        const key = b.id + '_day_' + today;
        if (!firedAlerts.has(key)) {
          firedAlerts.add(key);
          showNotification(
            '🚨 Vence HOJE — ' + b.name,
            'Valor: ' + fmtAmt(b.amount) + ' · Pague hoje para evitar juros!',
            b.id
          );
        }
      });
  }
}

// ================================================================
// EXIBIR NOTIFICAÇÃO NATIVA
// ================================================================
function showNotification(title, body, tag) {
  self.registration.showNotification(title, {
    body,
    tag:  'projecta_' + (tag || Date.now()),
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [500, 200, 500],
    requireInteraction: true,   // fica na tela até o usuário interagir
    actions: [
      { action: 'open',    title: '📱 Abrir app' },
      { action: 'dismiss', title: 'Dispensar'    }
    ],
    data: { url: self.registration.scope }
  });
}

// ================================================================
// FCM — notificações em segundo plano via Firebase
// (quando o app está completamente fechado)
// ================================================================
messaging.onBackgroundMessage(payload => {
  const title = (payload.notification && payload.notification.title) || 'PROJECT A';
  const body  = (payload.notification && payload.notification.body)  || 'Você tem contas vencendo!';
  showNotification(title, body, 'fcm_' + Date.now());
});

// ================================================================
// CLIQUE NA NOTIFICAÇÃO — abre o app
// ================================================================
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const existing = list.find(c => c.url.includes('project') || c.url === url);
        if (existing) return existing.focus();
        return clients.openWindow(url);
      })
  );
});

// ================================================================
// INSTALL / ACTIVATE — cache essencial
// ================================================================
const CACHE = 'projecta-v3';
const ASSETS = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ================================================================
// FETCH — servir do cache quando offline
// ================================================================
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ================================================================
// UTILITÁRIOS
// ================================================================
function pad(n)       { return String(n).padStart(2,'0'); }
function toDateStr(d) { return d.toISOString().split('T')[0]; }
function fmtAmt(v)    { return (v == null || isNaN(v)) ? 'Valor não informado' : 'R$ ' + Number(v).toFixed(2).replace('.',','); }
function fmtDate(s)   {
  if (!s) return '';
  const [y,m,d] = s.split('-');
  return d + '/' + m + '/' + y;
}
