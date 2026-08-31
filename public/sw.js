/* Sanctuary service worker.
 *
 * Strategy:
 *  - Navigations (HTML documents): network-first, fall back to the last cached
 *    copy of that URL, then to the static offline page. Only 2xx responses are
 *    cached so auth redirects/errors are never persisted.
 *  - Hashed build assets (/assets/*): cache-first — filenames are
 *    content-hashed, so a cached hit is always correct.
 *  - Other same-origin GETs (manifest, icons, splash screens, fonts):
 *    stale-while-revalidate.
 *  - Cross-origin requests and non-GET requests (all mutations, auth POSTs)
 *    pass through untouched.
 *
 * Bump CACHE_VERSION whenever the runtime strategy changes to force clients to
 * evict old caches on activation.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const NAV_CACHE = `nav-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(NAV_CACHE);
      await cache.add(OFFLINE_URL);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const stale = keys.filter(
        (key) => key !== STATIC_CACHE && key !== NAV_CACHE
      );
      await Promise.all(stale.map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

async function handleNavigation(request) {
  const cache = await caches.open(NAV_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

async function handleHashedAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function handleOtherStatic(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches
          .open(STATIC_CACHE)
          .then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(handleHashedAsset(request));
    return;
  }

  event.respondWith(handleOtherStatic(request));
});
