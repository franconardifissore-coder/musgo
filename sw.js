// Musgo Service Worker
// v1 — básico: permite instalación como PWA en iOS
// (sin cache offline ni push por ahora)

const CACHE_NAME = 'musgo-v1';

self.addEventListener('install', (event) => {
  // Activar inmediatamente sin esperar a que cierren otras pestañas
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Limpiar caches viejos si los hubiera
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Por ahora simplemente dejamos pasar todos los requests a la red
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
