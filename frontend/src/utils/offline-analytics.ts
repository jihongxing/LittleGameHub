/**
 * Offline Analytics
 * Enhancement 5: 离线分析 - 追踪离线使用情况
 */

export interface AnalyticsEvent {
  id: string;
  type: 'game_play' | 'game_download' | 'collection_create' | 'collection_add' | 'offline_access';
  timestamp: number;
  data: any;
  synced: boolean;
}

export interface OfflineUsageStats {
  totalGamesDownloaded: number;
  totalGamesPlayed: number;
  totalPlayTime: number; // in seconds
  totalOfflineTime: number; // in seconds
  mostPlayedGames: Array<{ gameId: number; playCount: number; playTime: number }>;
  downloadStats: {
    totalDownloads: number;
    successfulDownloads: number;
    failedDownloads: number;
    totalBytesDownloaded: number;
  };
  collectionStats: {
    totalCollections: number;
    totalGamesInCollections: number;
  };
}

const DB_NAME = 'OfflineAnalyticsDB';
const DB_VERSION = 1;
const EVENTS_STORE = 'events';
const STATS_STORE = 'stats';

/**
 * Open analytics database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Events store
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        const eventsStore = db.createObjectStore(EVENTS_STORE, { keyPath: 'id' });
        eventsStore.createIndex('type', 'type', { unique: false });
        eventsStore.createIndex('timestamp', 'timestamp', { unique: false });
        eventsStore.createIndex('synced', 'synced', { unique: false });
      }

      // Stats store
      if (!db.objectStoreNames.contains(STATS_STORE)) {
        db.createObjectStore(STATS_STORE, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Track analytics event
 */
export async function trackEvent(
  type: AnalyticsEvent['type'],
  data: any,
): Promise<void> {
  const db = await openDatabase();

  const event: AnalyticsEvent = {
    id: `${type}-${Date.now()}-${Math.random()}`,
    type,
    timestamp: Date.now(),
    data,
    synced: false,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENTS_STORE], 'readwrite');
    const store = transaction.objectStore(EVENTS_STORE);
    const request = store.add(event);

    request.onsuccess = () => {
      console.log(`[Analytics] Tracked: ${type}`, data);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Track game play
 */
export async function trackGamePlay(
  gameId: number,
  duration: number,
  score?: number,
): Promise<void> {
  await trackEvent('game_play', { gameId, duration, score, timestamp: Date.now() });
}

/**
 * Track game download
 */
export async function trackGameDownload(
  gameId: number,
  success: boolean,
  fileSize?: number,
  error?: string,
): Promise<void> {
  await trackEvent('game_download', {
    gameId,
    success,
    fileSize,
    error,
    timestamp: Date.now(),
  });
}

/**
 * Track offline access
 */
export async function trackOfflineAccess(duration: number): Promise<void> {
  await trackEvent('offline_access', { duration, timestamp: Date.now() });
}

/**
 * Get all unsynced events
 */
export async function getUnsyncedEvents(): Promise<AnalyticsEvent[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENTS_STORE], 'readonly');
    const store = transaction.objectStore(EVENTS_STORE);
    const index = store.index('synced');
    const request = index.getAll(0 as any);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark events as synced
 */
export async function markEventsSynced(eventIds: string[]): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENTS_STORE], 'readwrite');
    const store = transaction.objectStore(EVENTS_STORE);

    const promises = eventIds.map(id => {
      return new Promise<void>((res, rej) => {
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          const event = getRequest.result;
          if (event) {
            event.synced = true;
            const putRequest = store.put(event);
            putRequest.onsuccess = () => res();
            putRequest.onerror = () => rej(putRequest.error);
          } else {
            res();
          }
        };
        getRequest.onerror = () => rej(getRequest.error);
      });
    });

    Promise.all(promises)
      .then(() => resolve())
      .catch(reject);
  });
}

/**
 * Sync events to server
 */
export async function syncEvents(): Promise<{ synced: number; failed: number }> {
  const events = await getUnsyncedEvents();
  
  if (events.length === 0) {
    return { synced: 0, failed: 0 };
  }

  try {
    // Send events to server (placeholder)
    // const response = await fetch('/api/analytics/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ events }),
    // });

    // For now, just mark as synced
    const eventIds = events.map(e => e.id);
    await markEventsSynced(eventIds);

    console.log(`[Analytics] Synced ${events.length} events`);
    return { synced: events.length, failed: 0 };
  } catch (error) {
    console.error('[Analytics] Sync failed:', error);
    return { synced: 0, failed: events.length };
  }
}

/**
 * Get usage statistics
 */
export async function getUsageStats(): Promise<OfflineUsageStats> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENTS_STORE], 'readonly');
    const store = transaction.objectStore(EVENTS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const events: AnalyticsEvent[] = request.result || [];

      // Calculate statistics
      const gamePlayEvents = events.filter(e => e.type === 'game_play');
      const downloadEvents = events.filter(e => e.type === 'game_download');
      const offlineAccessEvents = events.filter(e => e.type === 'offline_access');

      // Game play stats
      const gamePlayMap = new Map<number, { playCount: number; playTime: number }>();
      let totalPlayTime = 0;

      gamePlayEvents.forEach(event => {
        const { gameId, duration } = event.data;
        const existing = gamePlayMap.get(gameId) || { playCount: 0, playTime: 0 };
        gamePlayMap.set(gameId, {
          playCount: existing.playCount + 1,
          playTime: existing.playTime + duration,
        });
        totalPlayTime += duration;
      });

      const mostPlayedGames = Array.from(gamePlayMap.entries())
        .map(([gameId, stats]) => ({ gameId, ...stats }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 10);

      // Download stats
      const successfulDownloads = downloadEvents.filter(e => e.data.success).length;
      const failedDownloads = downloadEvents.filter(e => !e.data.success).length;
      const totalBytesDownloaded = downloadEvents
        .filter(e => e.data.success && e.data.fileSize)
        .reduce((sum, e) => sum + e.data.fileSize, 0);

      // Offline access stats
      const totalOfflineTime = offlineAccessEvents.reduce(
        (sum, e) => sum + (e.data.duration || 0),
        0,
      );

      const stats: OfflineUsageStats = {
        totalGamesDownloaded: successfulDownloads,
        totalGamesPlayed: gamePlayMap.size,
        totalPlayTime,
        totalOfflineTime,
        mostPlayedGames,
        downloadStats: {
          totalDownloads: downloadEvents.length,
          successfulDownloads,
          failedDownloads,
          totalBytesDownloaded,
        },
        collectionStats: {
          totalCollections: 0, // Would need to query collections
          totalGamesInCollections: 0,
        },
      };

      resolve(stats);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear analytics data
 */
export async function clearAnalyticsData(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENTS_STORE, STATS_STORE], 'readwrite');
    
    const eventsStore = transaction.objectStore(EVENTS_STORE);
    const statsStore = transaction.objectStore(STATS_STORE);

    const clearEvents = eventsStore.clear();
    const clearStats = statsStore.clear();

    Promise.all([
      new Promise<void>((res, rej) => {
        clearEvents.onsuccess = () => res();
        clearEvents.onerror = () => rej(clearEvents.error);
      }),
      new Promise<void>((res, rej) => {
        clearStats.onsuccess = () => res();
        clearStats.onerror = () => rej(clearStats.error);
      }),
    ])
      .then(() => {
        console.log('[Analytics] Data cleared');
        resolve();
      })
      .catch(reject);
  });
}

/**
 * Auto-sync events at regular intervals
 */
export function startAutoSync(intervalMs: number = 300000): () => void {
  console.log('[Analytics] Starting auto-sync...');

  const intervalId = setInterval(() => {
    syncEvents().catch(error => {
      console.error('[Analytics] Auto-sync failed:', error);
    });
  }, intervalMs);

  return () => {
    console.log('[Analytics] Stopping auto-sync...');
    clearInterval(intervalId);
  };
}

export default {
  trackEvent,
  trackGamePlay,
  trackGameDownload,
  trackOfflineAccess,
  getUnsyncedEvents,
  syncEvents,
  getUsageStats,
  clearAnalyticsData,
  startAutoSync,
};

