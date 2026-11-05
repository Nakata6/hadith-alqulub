// Generated build replaces these markers; all URLs are relative to this worker's scope.
const REVISION = "__REVISION__";
const FILES = /*__PRECACHE__*/ [];
const ROOT = self.registration.scope;
const PREFIX = `hadith-offline:${new URL(ROOT).pathname}:`;
const CACHE = PREFIX + REVISION;
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new Request(new URL(file, ROOT).href, { cache: "reload" })))));
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // Open tabs may still reference assets from an earlier version.
    const clients = (await self.clients.matchAll({ type: "window", includeUncontrolled: true })).filter(client => client.url.startsWith(ROOT));
    if (clients.length <= 1) await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("message", event => {
  if (event.data?.type === "GET_VERSION") event.ports[0]?.postMessage({ revision: REVISION });
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.href.startsWith(ROOT)) return;
  // Serve one complete version, including its matching HTML and hashed assets.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === "navigate") {
      return await cache.match(new URL("index.html", ROOT).href) || fetch(request);
    }
    const current = await cache.match(request);
    if (current) return current;
    // Hashed assets requested by a tab still running an older release.
    if (url.pathname.includes("/assets/")) {
      for (const key of await caches.keys()) {
        if (key.startsWith(PREFIX)) {
          const old = await (await caches.open(key)).match(request);
          if (old) return old;
        }
      }
    }
    return fetch(request);
  })());
});
