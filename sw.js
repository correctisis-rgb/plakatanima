/* PTS service worker: uygulama kabuğunu önbelleğe alır, çevrimdışı açılışı sağlar.
   Sadece aynı adresteki dosyalara dokunur; kamera köprüsü (localhost:1984) ve CDN istekleri doğrudan gider.
   Sayfayı güncelleyince aşağıdaki sürüm numarasını artırın. */
const V = 'pts-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if(r.method !== 'GET') return;
  const u = new URL(r.url);
  if(u.origin !== location.origin) return;
  if(r.mode === 'navigate'){   // sayfa: önce ağ (güncel kalsın), yoksa önbellek
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put('./index.html', cp)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if(res.ok){ const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
    return res;
  })));
});
