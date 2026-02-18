const CACHE_NAME = 'sunger-hesap-v20';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './marfom_logo.png',
    './icon-192x192.png',
    './icon-512x512.png',
    './apple-touch-icon.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(
                names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
            )
        )
    );
    self.clients.claim();
});

// Network-first stratejisi: Once internetten dene, baglantiyi yoksa onbellekten sun
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Basarili yaniti onbellege de kaydet
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, clone);
                });
                return response;
            })
            .catch(() => {
                // Internet yoksa onbellekten sun (cevrimdisi destek)
                return caches.match(event.request);
            })
    );
});
