// Musgo Service Worker
// v2 — agrega soporte de Web Push notifications

const CACHE_NAME = 'musgo-v2';

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

// Dejamos pasar todos los requests a la red
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// ─── Push notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = { title: 'Musgo', body: 'Revisá tus plantas 🌱', url: '/dashboard/thirsty' };

  if (event.data) {
    try {
      data = { ...data, ...JSON.parse(event.data.text()) };
    } catch (_) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/resources/icon-192.png',
      badge: '/resources/icon-192.png',
      data: { url: data.url || '/dashboard/thirsty' },
      vibrate: [100, 50, 100],
    })
  );
});

// Al tocar la notificación → abrir/enfocar Musgo en la pantalla correcta
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard/thirsty';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta, enfocarla y navegar
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Si no, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
