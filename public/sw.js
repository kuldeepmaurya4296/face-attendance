// Empty service worker to resolve 404 errors if the browser requests it.
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    self.clients.claim();
});
