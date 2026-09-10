const CACHE_NAME = "besafe-field-v2";

const PRECACHE_URLS = [
  "/field",
  "/field/map",
  "/field/profile",
  "/login?role=field",
  "/manifest.json",
];

// --- Helper: IndexedDB for offline queue ---

function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("besafe-offline-queue", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("requests", {
        keyPath: "id",
        autoIncrement: true,
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueueRequest(request) {
  const db = await openQueueDB();
  const body = await request.clone().text();
  const entry = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction("requests", "readwrite");
    tx.objectStore("requests").add(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function processQueue() {
  const db = await openQueueDB();
  const tx = db.transaction("requests", "readwrite");
  const store = tx.objectStore("requests");
  const all = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve([]);
  });

  const results = [];
  for (const entry of all) {
    try {
      const res = await fetch(
        new Request(entry.url, {
          method: entry.method,
          headers: entry.headers,
          body: entry.body,
        })
      );
      if (res.ok) {
        store.delete(entry.id);
      }
      results.push({ id: entry.id, status: res.status });
    } catch {
      // Still offline, keep in queue
    }
  }
  return results;
}

// --- Install: pre-cache field shell ---

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// --- Activate: purge old caches ---

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
  );
  self.clients.claim();
});

// --- Fetch: network-first for navigation, offline queue for mutations ---

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET, API calls, Railway backend, Mapbox, Socket.IO
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api") ||
    url.origin.includes("up.railway.app") ||
    url.origin.includes("mapbox.com") ||
    url.origin.includes("socket.io")
  ) {
    // For failed POST/PUT/PATCH, store in offline queue
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      event.respondWith(
        fetch(request).catch(async () => {
          await enqueueRequest(request);
          try {
            const reg = await self.registration.sync.register(
              "sync-offline-queue"
            );
          } catch {
            // Background sync not supported; queue stays for next manual trigger
          }
          return new Response(
            JSON.stringify({ queued: true, message: "Request stored for retry" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        })
      );
    }
    return;
  }

  // GET requests: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Fallback to precached shell for navigation
        if (request.mode === "navigate") {
          const shell = await caches.match("/field");
          if (shell) return shell;
        }
        return new Response("Offline", { status: 503 });
      })
  );
});

// --- Message: skip waiting ---

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// --- Background sync ---

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-queue") {
    event.waitUntil(processQueue());
  }
});
