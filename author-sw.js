/* ACORN 해양 저자 앱 — 서비스워커 (오프라인 우선) */
const CACHE = 'acorn-maritime-v1';
const CORE = [
  './author-app.html',
  './author-app.webmanifest',
  './author-icon-192.png',
  './author-icon-512.png'
];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.includes('supabase')) return; // API는 항상 네트워크
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('./author-app.html')))
    );
    return;
  }
  e.respondWith(caches.match(req).then(c => c || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(x => x.put(req, cp)); return res; }).catch(() => c)));
});
/* 서버 푸시(Web Push) 준비 — VAPID/푸시 서버 연동 시 사용
self.addEventListener('push', e => {
  const d = (() => { try { return e.data.json(); } catch (_) { return { title: '알림', body: e.data && e.data.text() }; } })();
  e.waitUntil(self.registration.showNotification(d.title || 'ACORN 해양 저자', { body: d.body || '', icon: './author-icon-192.png' }));
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(clients.openWindow('./author-app.html')); });
*/
