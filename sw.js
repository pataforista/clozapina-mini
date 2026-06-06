/* sw.js — CLZ Mini PWA (offline-first) */
const SW_VERSION = "1.3.0";
const CACHE_NAME = "clz-mini-pwa-v" + SW_VERSION;
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./demo-data.json",
  "./engine.js",
  "./galaxy.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS);
    // NOTE: no skipWaiting() here. The new worker waits until the user
    // confirms via the in-app "Actualizar" prompt (controlled force update).
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

// Allow the page to trigger the waiting worker to take over immediately,
// and to query the active version.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (data.type === "GET_VERSION") {
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ type: "VERSION", version: SW_VERSION });
    }
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      // cache same-origin only
      const url = new URL(req.url);
      if (url.origin === self.location.origin) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      // offline fallback
      return cache.match("./index.html", { ignoreSearch: true });
    }
  })());
});
