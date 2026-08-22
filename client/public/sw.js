const CACHE_PREFIX = "hadith-alqulub-shell";
const CACHE_VERSION = "v2";
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;
const APP_SHELL = ["/offline.html", "/manifest.json"];

function isPrivateOrDynamicRequest(url) {
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/manus-storage/") || url.pathname.startsWith("/oauth/");
}

function isStaticAsset(request, url) {
  if (url.pathname.startsWith("/src/") || url.pathname.startsWith("/@") || url.searchParams.has("v")) return false;
  return request.destination === "script" || request.destination === "style" || request.destination === "font" || (request.destination === "image" && !url.pathname.startsWith("/manus-storage/")) || url.pathname.startsWith("/assets/");
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isPrivateOrDynamicRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  if (!isStaticAsset(request, url)) return;

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== "basic") return response;
        const cachedResponse = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, cachedResponse)).catch(() => undefined);
        return response;
      })
      .catch(() => caches.match(request))),
  );
});
