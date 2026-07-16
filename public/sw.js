const BUILD = "tailor-shell-v2"
const SHELL = ["/", "/manifest.webmanifest"]
self.addEventListener("install", (event) => event.waitUntil(caches.open(BUILD).then((cache) => cache.addAll(SHELL))))
self.addEventListener("activate", (event) => event.waitUntil(Promise.all([caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== BUILD).map((key) => caches.delete(key)))), self.clients.claim()])))
self.addEventListener("message", (event) => { if (event.data?.type === "SKIP_WAITING") void self.skipWaiting() })
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok && ["document", "script", "style", "image", "font"].includes(event.request.destination)) { const copy = response.clone(); void caches.open(BUILD).then((cache) => cache.put(event.request, copy)) }
    return response
  }).catch(async () => (await caches.match(event.request)) || (event.request.mode === "navigate" ? caches.match("/") : Response.error())))
})
self.addEventListener("sync", (event) => { if (event.tag === "tailor-backup") event.waitUntil(self.clients.matchAll({ type: "window" }).then((clients) => clients.forEach((client) => client.postMessage({ type: "BACKUP_DUE" })))) })
