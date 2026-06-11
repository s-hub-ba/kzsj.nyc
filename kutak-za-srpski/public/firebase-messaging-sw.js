/*
  Migration service worker.
  Replaces stale Firebase Messaging worker versions that fetch missing endpoints
  (for example /api/firebase-config) and break chunk loading.
*/

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      } catch (error) {
        console.warn("[firebase-messaging-sw] cache cleanup failed", error);
      }

      await self.clients.claim();

      try {
        await self.registration.unregister();
        console.info("[firebase-messaging-sw] stale worker unregistered");
      } catch (error) {
        console.warn("[firebase-messaging-sw] unregister failed", error);
      }
    })(),
  );
});
