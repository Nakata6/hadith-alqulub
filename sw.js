const CACHE_NAME = "hadith-alqulub-modern-v4";
const BASE = "/hadith-alqulub/";
const APP_SHELL = [
  "/hadith-alqulub/assets/index-BvGk71oB.css",
  "/hadith-alqulub/assets/index.static-BzCs2iN5.js",
  "/hadith-alqulub/index.html",
  "/hadith-alqulub/manifest.json",
  "/hadith-alqulub/sw.js",
  "/hadith-alqulub/icon.svg",
  "/hadith-alqulub/icon-192.png",
  "/hadith-alqulub/icon-512.png",
  "/hadith-alqulub/card-stamp.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith("hadith-alqulub-") && key !== CACHE_NAME)
    .map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(BASE) || caches.match(BASE + "index.html")));
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && response.type === "basic") {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  }).catch(() => cached)));
});
