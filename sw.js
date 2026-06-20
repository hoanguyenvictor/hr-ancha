const CACHE = 'hr-v3';
const ASSETS = ['/index.html', '/employee.html', '/style.css', '/db.js', '/manifest.json'];

// Cài đặt: cache toàn bộ static files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Kích hoạt: xoá cache cũ
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: static files → cache trước, API → network trước
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API calls (Google Apps Script) → luôn network
  if (url.hostname.includes('script.google.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{"ok":false,"offline":true}', {headers:{'Content-Type':'application/json'}})));
    return;
  }
  // Static files → cache first, fallback network
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
