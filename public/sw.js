const CACHE_NAME = "esperanza-v2";
const STATIC_ASSETS = [
    "/manifest.json",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    // network-first for API routes and HTML pages
    // only use cache-first for truly static assets (images, fonts, css, js bundles)
    const url = new URL(event.request.url);
    const is_static_asset = /\.(js|css|png|jpg|jpeg|svg|gif|ico|woff2?|ttf|eot)$/i.test(url.pathname);

    if (!is_static_asset) {
        // network-first: always try fresh content, fall back to cache offline
        event.respondWith(
            fetch(event.request)
                .then(function handle_response(response) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(function update_cache(cache) {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(function use_cache() {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // cache-first for static assets only
    event.respondWith(
        caches.match(event.request).then(function check_cache(cached) {
            return cached || fetch(event.request).then(function cache_new(response) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(function store(cache) {
                    cache.put(event.request, clone);
                });
                return response;
            });
        })
    );
});
