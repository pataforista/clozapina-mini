/* sw.js — CLZ Mini PWA (offline-first) */
const CACHE_NAME = "clz-mini-pwa-v1.1.0";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./demo-data.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if(req.method !== "GET") return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, {ignoreSearch:true});
    if(cached) return cached;

    try{
      const fresh = await fetch(req);
      // cache same-origin only
      const url = new URL(req.url);
      if(url.origin === self.location.origin){
        cache.put(req, fresh.clone());
      }
      return fresh;
    }catch(err){
      // offline fallback
      return cache.match("./index.html", {ignoreSearch:true});
    }
  })());
});
