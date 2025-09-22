/**
 * Service Worker for Orbweaver Natural Landcare
 * Provides offline support and performance optimization
 */

const CACHE_NAME = 'orbweaver-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_CACHE = [
    '/',
    '/index.html',
    '/styles.min.css',
    '/js/main.js',
    '/smartquotes.js',
    '/manifest.json',
    OFFLINE_URL
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.open(CACHE_NAME)
                        .then(cache => cache.match(OFFLINE_URL));
                })
        );
        return;
    }

    // For other requests, try network first, then cache
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
