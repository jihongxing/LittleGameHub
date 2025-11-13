/**
 * Background Sync Utility
 * Enhancement 4: 后台下载 - 使用 Background Sync API
 */

const SYNC_TAG_PREFIX = 'game-download-';

export interface BackgroundSyncTask {
  tag: string;
  gameId: number;
  gameTitle: string;
  gameUrl: string;
  timestamp: number;
}

/**
 * Check if Background Sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
}

/**
 * Register a background sync task for game download
 */
export async function registerBackgroundDownload(
  gameId: number,
  gameTitle: string,
  gameUrl: string,
): Promise<void> {
  if (!isBackgroundSyncSupported()) {
    throw new Error('Background Sync not supported');
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const tag = `${SYNC_TAG_PREFIX}${gameId}-${Date.now()}`;

    // Store task details in IndexedDB for service worker to access
    await storeBackgroundSyncTask({
      tag,
      gameId,
      gameTitle,
      gameUrl,
      timestamp: Date.now(),
    });

    // Register sync event
    await (registration as any).sync.register(tag);
    console.log(`[Background Sync] Registered download for ${gameTitle}`);
  } catch (error) {
    console.error('[Background Sync] Registration failed:', error);
    throw error;
  }
}

/**
 * Register multiple background downloads
 */
export async function registerBatchBackgroundDownloads(
  games: Array<{ gameId: number; gameTitle: string; gameUrl: string }>,
): Promise<void> {
  const promises = games.map(game =>
    registerBackgroundDownload(game.gameId, game.gameTitle, game.gameUrl),
  );

  await Promise.all(promises);
  console.log(`[Background Sync] Registered ${games.length} downloads`);
}

/**
 * Get all registered sync tags
 */
export async function getRegisteredSyncTags(): Promise<string[]> {
  if (!isBackgroundSyncSupported()) {
    return [];
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const tags = await (registration as any).sync.getTags();
    return tags.filter((tag: string) => tag.startsWith(SYNC_TAG_PREFIX));
  } catch (error) {
    console.error('[Background Sync] Get tags failed:', error);
    return [];
  }
}

/**
 * Store background sync task in IndexedDB
 */
async function storeBackgroundSyncTask(task: BackgroundSyncTask): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BackgroundSyncDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      const addRequest = store.add(task);

      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'tag' });
      }
    };
  });
}

/**
 * Get background sync task from IndexedDB
 */
export async function getBackgroundSyncTask(tag: string): Promise<BackgroundSyncTask | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BackgroundSyncDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');
      const getRequest = store.get(tag);

      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
}

/**
 * Remove background sync task from IndexedDB
 */
export async function removeBackgroundSyncTask(tag: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BackgroundSyncDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      const deleteRequest = store.delete(tag);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

/**
 * Check sync status
 */
export async function checkSyncStatus(): Promise<{
  supported: boolean;
  registered: number;
  tasks: BackgroundSyncTask[];
}> {
  const supported = isBackgroundSyncSupported();
  const tags = await getRegisteredSyncTags();
  
  const tasks: BackgroundSyncTask[] = [];
  for (const tag of tags) {
    const task = await getBackgroundSyncTask(tag);
    if (task) {
      tasks.push(task);
    }
  }

  return {
    supported,
    registered: tags.length,
    tasks,
  };
}

export default {
  isBackgroundSyncSupported,
  registerBackgroundDownload,
  registerBatchBackgroundDownloads,
  getRegisteredSyncTags,
  getBackgroundSyncTask,
  removeBackgroundSyncTask,
  checkSyncStatus,
};

