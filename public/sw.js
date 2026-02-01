if (navigator.userAgent.includes("Firefox")) {
  Object.defineProperty(globalThis, "crossOriginIsolated", {
    value: true,
    writable: false,
  });
}

console.log('[SW] Service Worker starting...');

// Import from YOUR file location
importScripts("/js/scramjet/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

console.log('[SW] ✅ Scramjet service worker initialized');

/**
 * @param {FetchEvent} event
 * @returns {Promise<Response>}
 */
async function handleRequest(event) {
  await scramjet.loadConfig();

  if (scramjet.route(event)) {
    const response = await scramjet.fetch(event);
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/html")) {
      const originalText = await response.text();
      const encoder = new TextEncoder();
      const byteLength = encoder.encode(originalText).length;
      const newHeaders = new Headers(response.headers);
      newHeaders.set("content-length", byteLength.toString());

      return new Response(originalText, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    return response;
  }

  return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activated, claiming clients...');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('install', (event) => {
    console.log('[SW] Installed');
    self.skipWaiting();
});

console.log('[SW] Scramjet service worker ready');