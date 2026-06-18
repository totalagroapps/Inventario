const CACHE_NAME = 'gams-inventario-v1';
const ASSETS = [
  '/pwa/',
  '/pwa/index.html',
  '/pwa/login.html',
  '/pwa/scan.html',
  '/pwa/manifest.json',
  'https://unpkg.com/html5-qrcode'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/') || e.request.url.includes('/auth/')) {
    // Para llamadas a la API usar network first o solo network
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
