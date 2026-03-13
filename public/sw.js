const CACHE_VERSION = "esperanza-v3";
const PRECACHE = ["/manifest.json"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

function shouldSkipInterception(request, url) {
    if (request.method !== "GET") return true;
    const path = url.pathname;
    if (path.startsWith("/api") || path.startsWith("/auth")) return true;
    if (path.startsWith("/_next/data")) return true;
    if (request.mode === "navigate") return true;
    const rsc = request.headers.get("RSC");
    const accept = request.headers.get("Accept") || "";
    const nextRouter = request.headers.get("Next-Router-State-Tree");
    if (rsc || accept.includes("text/x-component") || nextRouter) return true;
    return false;
}

function isLowRiskStatic(path) {
    return (
        path === "/manifest.json" ||
        /^\/icons?\//.test(path) ||
        /\.(png|jpg|jpeg|svg|gif|ico|webp)$/i.test(path) ||
        /\.(woff2?|ttf|eot)$/i.test(path)
    );
}

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (shouldSkipInterception(event.request, url)) return;

    if (!isLowRiskStatic(url.pathname)) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (!response || response.status !== 200 || response.type === "error") return response;
                const clone = response.clone();
                caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
