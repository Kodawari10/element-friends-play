/* Offline cache for Element Friends */
const CACHE = 'element-friends-v51';
const FILES = ['./', './index.html', './css/style.css', './js/data.js', './js/art.js', './js/audio.js', './js/sticker.js', './js/game.js', './js/daily.js', './js/welcome.js', './js/japanese.js', './js/omikuji.js', './js/achievements.js', './js/weather.js', './js/costumes.js', './js/chain-ids.js', './js/backup.js', './js/install.js', './js/starknet-config.js', './js/starknet-abi.js', './js/starknet.js', './js/vendor/get-starknet-core.js',
  './js/vendor/starkzap.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return; // never cache RPC / wallet traffic
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
