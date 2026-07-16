const BUILD = "tailor-shell-v3"
const SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(BUILD).then((cache) => cache.addAll(SHELL)))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("tailor-shell-") && key !== BUILD).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]))
})

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting()
})

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(BUILD)
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    return (await caches.match(request)) || (await caches.match("/")) || Response.error()
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(BUILD)
    await cache.put(request, response.clone())
  }
  return response
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(networkFirst(event.request))
    return
  }
  if (["script", "style", "image", "font"].includes(event.request.destination)) {
    event.respondWith(cacheFirst(event.request))
  }
})

self.addEventListener("sync", (event) => {
  if (event.tag === "tailor-backup") event.waitUntil(self.clients.matchAll({ type: "window" }).then((clients) => clients.forEach((client) => client.postMessage({ type: "BACKUP_DUE" }))))
})
