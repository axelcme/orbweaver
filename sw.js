/**
 * Service Worker for Orbweaver Natural Landcare
 * Provides offline support with proper error handling
 */

const CACHE_NAME = 'orbweaver-v1.1.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install - only files that actually exist
const STATIC_CACHE = [
    '/',
    '/index.html',
    '/styles.min.css',
    '/js/main.js',
    '/manifest.json',
    OFFLINE_URL
];

// Install event - cache static assets with error handling
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Try to cache each file individually to handle failures
                return Promise.all(
                    STATIC_CACHE.map(url => {
                        return cache.add(url).catch(err => {
                            console.warn(`Failed to cache ${url}:`, err);
                            // Continue even if individual files fail
                            return Promise.resolve();
                        });
                    })
                );
            })
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

// Fetch event - network first with proper fallbacks
self.addEventListener('fetch', (event) => {
    // Handle navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(OFFLINE_URL);
                })
        );
        return;
    }

    // For other requests, try network first, then cache
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Only cache successful responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Don't cache POST requests or external resources
                if (event.request.method !== 'GET' || 
                    !event.request.url.startsWith(self.location.origin)) {
                    return response;
                }

                // Clone and cache the response
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    })
                    .catch(err => {
                        console.warn('Cache put failed:', err);
                    });

                return response;
            })
            .catch(() => {
                // Try to return from cache
                return caches.match(event.request);
            })
    );
});
