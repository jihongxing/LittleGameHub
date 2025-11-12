/**
 * Service Worker for Offline Game Caching (User Story 7)
 * T195: Service Worker implementation for offline caching
 */

const CACHE_NAME = 'gamehub-offline-v1';
const STATIC_CACHE_NAME = 'gamehub-static-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    // Network-first strategy for API
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Handle game assets (for offline games)
  if (url.pathname.includes('/games/') || url.pathname.includes('/offline/')) {
    // Cache-first strategy for game assets
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request).then((response) => {
            // Don't cache if not a success response
            if (!response || response.status !== 200) {
              return response;
            }
            
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            
            return response;
          });
        })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(request);
      })
  );
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'CACHE_GAME':
      // Cache a specific game
      cacheGame(payload.gameId, payload.gameUrl);
      break;
      
    case 'REMOVE_GAME':
      // Remove a game from cache
      removeGameFromCache(payload.gameId);
      break;
      
    case 'CLEAR_CACHE':
      // Clear all cached games
      clearGameCache();
      break;
      
    case 'GET_CACHE_SIZE':
      // Get total cache size
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
      
    default:
      console.log('[Service Worker] Unknown message type:', type);
  }
});

// Helper: Cache a game
async function cacheGame(gameId, gameUrl) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(gameUrl);
    await cache.put(`/games/${gameId}`, response);
    console.log(`[Service Worker] Cached game ${gameId}`);
    
    // Notify client
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'GAME_CACHED',
          gameId,
        });
      });
    });
  } catch (error) {
    console.error(`[Service Worker] Failed to cache game ${gameId}:`, error);
    
    // Notify client of failure
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'GAME_CACHE_FAILED',
          gameId,
          error: error.message,
        });
      });
    });
  }
}

// Helper: Remove game from cache
async function removeGameFromCache(gameId) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(`/games/${gameId}`);
    console.log(`[Service Worker] Removed game ${gameId} from cache`);
  } catch (error) {
    console.error(`[Service Worker] Failed to remove game ${gameId}:`, error);
  }
}

// Helper: Clear all game cache
async function clearGameCache() {
  try {
    await caches.delete(CACHE_NAME);
    await caches.open(CACHE_NAME); // Re-create empty cache
    console.log('[Service Worker] Cleared game cache');
  } catch (error) {
    console.error('[Service Worker] Failed to clear cache:', error);
  }
}

// Helper: Get total cache size
async function getCacheSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

console.log('[Service Worker] Loaded');

