/* الموسوعة الإسلامية — service worker
 * Cache-first for the bundled app data (/data/*) and static assets so the whole
 * mushaf (fonts + pages + hadith) works offline. Mushaf scan images served from
 * the on-demand "mushaf-images" cache, and viewed tafsir pages from "runtime".
 * Audio streaming is left alone — offline audio is provided by the app's own
 * IndexedDB download feature so playback works everywhere.
 */

const SHELL = "shell-v2";
const RUNTIME = "runtime-v2";
const MUSHAF_IMAGES = "mushaf-images";
const IMAGE_HOSTS = ["files.quran.app", "quran.ksu.edu.sa"];
const SHELL_ASSET = /\.(js|css|woff2?|ttf|png|jpe?g|webp|svg|ico|json)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL && k !== RUNTIME && k !== MUSHAF_IMAGES)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const { pathname } = url;

  /* mushaf scan images — serve from the download cache, else fetch & store */
  if (IMAGE_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(MUSHAF_IMAGES).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req, { mode: "no-cors" });
          if (res) cache.put(req, res.clone());
          return res;
        } catch {
          return Response.error();
        }
      }),
    );
    return;
  }

  /* tafsir api — network first, cached for later offline reading */
  if (url.hostname === "api.quran.com") {
    event.respondWith(
      caches.open(RUNTIME).then(async (cache) => {
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          const hit = await cache.match(req);
          if (hit) return hit;
          return Response.error();
        }
      }),
    );
    return;
  }

  /* cross-origin audio/anything else: pass through untouched */
  if (url.origin !== self.location.origin) return;

  /* bundled data + static assets: cache-first.
   * The root document (/) is intentionally NOT cached here so it always
   * falls through to the network-first navigation handler below — otherwise a
   * stale shell would be served forever after an update. */
  if (pathname.startsWith("/data/") || SHELL_ASSET.test(pathname)) {
    event.respondWith(
      caches.open(SHELL).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  /* navigations: network first, cache the response for offline reuse,
   * fall back to the exact cached page, then to the generic shell. */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL);
          const exact = await cache.match(req);
          if (exact) return exact;
          return (await cache.match("/")) || Response.error();
        }),
    );
  }
});
