/* Sanctuary service worker.
 *
 * The app requires an internet connection, so this worker deliberately does
 * NOT cache pages, router data, or assets — serving partially cached content
 * offline produced broken, unusable UI. Its jobs are:
 *
 *  - Make the app installable (Android/Chrome requires a fetch handler).
 *  - Serve a self-contained "you're offline" screen when a navigation cannot
 *    reach the network, instead of the browser's raw error page.
 *  - Provide push/notification handlers so iOS web push can be enabled later.
 *
 * Everything except same-origin GET navigations passes through untouched.
 * Bump CACHE_VERSION whenever the precache list changes to evict old caches.
 */

const CACHE_VERSION = "v7";
const CACHE_NAME = `offline-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

// Self-contained offline screen plus the icon it references.
const PRECACHE_URLS = [OFFLINE_URL, "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: try the network, fall back to the offline screen.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Precached assets (offline page imagery): serve without touching the
  // network so the offline screen stays intact. Everything else passes
  // through — failed subresource fetches are left to the app to handle.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// Web push scaffolding (unused until the server sends pushes; iOS requires
// an installed PWA plus a user-gesture permission request to subscribe).
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Sanctuary", {
      body: payload.body || "",
      icon: "/apple-touch-icon.png",
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin)) {
          await client.focus();
          if ("navigate" in client) await client.navigate(target.href);
          return;
        }
      }
      await self.clients.openWindow(target.href);
    })()
  );
});
