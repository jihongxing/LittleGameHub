/**
 * Image Cache Utility
 * Enhancement 1: 游戏封面缓存 - 预加载游戏封面图
 */

const IMAGE_CACHE_NAME = 'gamehub-images-v1';
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
}

/**
 * Preload and cache game cover images
 */
export async function preloadGameCovers(imageUrls: string[]): Promise<void> {
  if (!('caches' in window)) {
    console.warn('Cache API not supported');
    return;
  }

  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    
    // Batch fetch images
    const promises = imageUrls.map(async (url) => {
      try {
        // Check if already cached
        const cached = await cache.match(url);
        if (cached) {
          return;
        }

        // Fetch and cache
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log(`[Image Cache] Cached: ${url}`);
        }
      } catch (error) {
        console.error(`[Image Cache] Failed to cache ${url}:`, error);
      }
    });

    await Promise.all(promises);
    console.log(`[Image Cache] Preloaded ${imageUrls.length} images`);
  } catch (error) {
    console.error('[Image Cache] Preload failed:', error);
  }
}

/**
 * Get cached image or fetch from network
 */
export async function getCachedImage(url: string): Promise<string> {
  if (!('caches' in window)) {
    return url;
  }

  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cached = await cache.match(url);

    if (cached) {
      const blob = await cached.blob();
      return URL.createObjectURL(blob);
    }

    // Not cached, fetch and cache
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(url, response.clone());
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }

    return url;
  } catch (error) {
    console.error('[Image Cache] Get cached image failed:', error);
    return url;
  }
}

/**
 * Clear expired cached images
 */
export async function clearExpiredImages(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const requests = await cache.keys();
    const now = Date.now();

    for (const request of requests) {
      const response = await cache.match(request);
      if (!response) continue;

      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const cacheDate = new Date(dateHeader).getTime();
        if (now - cacheDate > MAX_CACHE_AGE) {
          await cache.delete(request);
          console.log(`[Image Cache] Deleted expired: ${request.url}`);
        }
      }
    }
  } catch (error) {
    console.error('[Image Cache] Clear expired failed:', error);
  }
}

/**
 * Clear all cached images
 */
export async function clearImageCache(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    await caches.delete(IMAGE_CACHE_NAME);
    console.log('[Image Cache] Cache cleared');
  } catch (error) {
    console.error('[Image Cache] Clear cache failed:', error);
  }
}

/**
 * Get cache size
 */
export async function getImageCacheSize(): Promise<number> {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const requests = await cache.keys();
    let totalSize = 0;

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('[Image Cache] Get cache size failed:', error);
    return 0;
  }
}

export default {
  preloadGameCovers,
  getCachedImage,
  clearExpiredImages,
  clearImageCache,
  getImageCacheSize,
};

