// OpenMaestro service worker: makes the app shell work offline.
// Runtime caching (cache-first for assets, network-first for navigation) so it
// survives Next's hashed filenames without a precomputed manifest. The model
// weights are NOT cached here — wllama persists those in OPFS itself.
const CACHE = "openmaestro-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") {
    return;
  }
  const url = new URL(req.url);
  // Only handle our own origin — cross-origin (HuggingFace model, etc.) is left alone.
  if (url.origin !== self.location.origin) {
    return;
  }

  if (req.mode === "navigate") {
    // Network-first so updates land; fall back to cached shell when offline.
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(CACHE);
          const cached = (await cache.match(req)) || (await cache.match("/"));
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  // Static assets: cache-first, populate on miss.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) {
        return cached;
      }
      try {
        const fresh = await fetch(req);
        if (fresh.ok) {
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch {
        return Response.error();
      }
    })(),
  );
});
