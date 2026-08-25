const CACHE_NAME = "hadith-alqulub-modern-v12";
const BASE = "/hadith-alqulub/";
const OFFLINE_DOCUMENT = BASE + "index.html";
const OFFLINE_PAGE = BASE + "offline.html";
const APP_SHELL = [
  "/hadith-alqulub/assets/index-C4vfEIya.css",
  "/hadith-alqulub/assets/index.static-BNgNzAHg.js",
  "/hadith-alqulub/fonts/amiri-arabic-400.woff2",
  "/hadith-alqulub/fonts/amiri-arabic-700.woff2",
  "/hadith-alqulub/fonts/cairo-arabic-variable.woff2",
  "/hadith-alqulub/fonts.css",
  "/hadith-alqulub/index.html",
  "/hadith-alqulub/manifest.json",
  "/hadith-alqulub/sw.js",
  "/hadith-alqulub/icon.svg",
  "/hadith-alqulub/icon-192.png",
  "/hadith-alqulub/icon-512.png",
  "/hadith-alqulub/card-stamp.png",
  "/hadith-alqulub/offline.html"
];

async function offlineNavigationResponse() {
  const cachedDocument = await caches.match(OFFLINE_DOCUMENT, { ignoreSearch: true }) || await caches.match(BASE, { ignoreSearch: true });
  if (cachedDocument) return cachedDocument;
  const offlinePage = await caches.match(OFFLINE_PAGE, { ignoreSearch: true });
  if (offlinePage) return offlinePage;
  return new Response("<!doctype html><title>حديث القلوب</title><p>التطبيق غير متاح دون اتصال حالياً.</p>", {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

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
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        return offlineNavigationResponse();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    } catch {
      return new Response("", { status: 503, statusText: "Offline" });
    }
  })());
});
