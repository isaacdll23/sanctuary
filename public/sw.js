/* Sanctuary service worker.
 *
 * Strategy:
 *  - Navigations (HTML documents): network-first, fall back to the last cached
 *    copy of that URL (exact, then query-ignoring), then to the static offline
 *    page. Only 2xx responses are cached so auth redirects/errors are never
 *    persisted.
 *  - Hashed build assets (/assets/*): cache-first — filenames are
 *    content-hashed, so a cached hit is always correct.
 *  - Other same-origin GETs (.data requests, manifest, icons, fonts):
 *    network-first with cache fallback, so router data stays fresh online and
 *    remains readable offline after a visit.
 *  - Cross-origin requests and non-GET requests (all mutations, auth POSTs)
 *    pass through untouched.
 *
 * Every cache.put is awaited before the response is returned so the browser
 * cannot terminate the worker before the write lands. Bump CACHE_VERSION
 * whenever the runtime strategy changes to force clients to evict old caches
 * on activation.
 */

const CACHE_VERSION = "v5";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const NAV_CACHE = `nav-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// Always-available assets: offline fallback plus brand imagery referenced by
// the shell and app manifests, so an offline reload never shows broken images.
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/apple-touch-icon.png",
  "/sanctuary-logo-192.png",
  "/sanctuary-logo-512.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(NAV_CACHE);
      await cache.addAll(PRECACHE_URLS);
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
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Exact match first; fall back to an ignoreSearch match because SPA URL
    // params (e.g. /tasks?filter=...) are often added after the page was
    // cached under its bare path.
    const cached =
      (await cache.match(request)) ||
      (await cache.match(request, { ignoreSearch: true }));
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
    await cache.put(request, response.clone());
  }
  return response;
}

async function handleOtherStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      // For router data requests, also cache the route's HTML document so
      // offline navigation works for routes that were only ever reached via
      // SPA transitions (no document request was ever made for them).
      if (new URL(request.url).pathname.endsWith(".data")) {
        await cacheRouteDocument(request.url).catch(() => {});
      }
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

async function cacheRouteDocument(dataUrl) {
  const url = new URL(dataUrl);
  const docPath = url.pathname.replace(/\.data$/, "");
  const response = await fetch(docPath + url.search, {
    redirect: "follow",
  });
  if (!response.ok) return;
  const cache = await caches.open(NAV_CACHE);
  await cache.put(new Request(docPath + url.search), response.clone());
  // Also key the bare path so exact matches hit when the SPA later strips
  // or changes search params.
  if (url.search) {
    await cache.put(new Request(docPath), response.clone());
  }
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
