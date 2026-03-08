const CACHE_NAME = 'attendance-v2-cache';
const ASSETS = [
    'index.html',
    'style.css',
    'main.js',
    'manifest.json',
    'icon.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request);
        })
    );
});
