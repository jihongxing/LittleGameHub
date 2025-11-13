/**
 * IndexedDB Storage for Offline Games (User Story 7)
 * T196: IndexedDB implementation for offline game storage
 */

const DB_NAME = 'GameHubOffline';
const DB_VERSION = 1;
const STORE_NAME = 'games';

export interface OfflineGameData {
  id: number;
  gameId: number;
  gameTitle: string;
  gameUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  downloadedAt: Date;
  lastPlayedAt?: Date;
  playCount: number;
  gameData?: Blob;
}

/**
 * Open IndexedDB connection
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        
        // Create indexes
        objectStore.createIndex('gameId', 'gameId', { unique: true });
        objectStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        objectStore.createIndex('lastPlayedAt', 'lastPlayedAt', { unique: false });
      }
    };
  });
}

/**
 * Save game to IndexedDB
 */
export async function saveOfflineGame(gameData: Omit<OfflineGameData, 'id'>): Promise<number> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(gameData);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get game from IndexedDB
 */
export async function getOfflineGame(gameId: number): Promise<OfflineGameData | null> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('gameId');
    const request = index.get(gameId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all offline games
 */
export async function getAllOfflineGames(): Promise<OfflineGameData[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update game in IndexedDB
 */
export async function updateOfflineGame(id: number, updates: Partial<OfflineGameData>): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const game = getRequest.result;
      if (!game) {
        reject(new Error('Game not found'));
        return;
      }

      const updatedGame = { ...game, ...updates };
      const putRequest = store.put(updatedGame);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Delete game from IndexedDB
 */
export async function deleteOfflineGame(gameId: number): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('gameId');
    const getRequest = index.getKey(gameId);

    getRequest.onsuccess = () => {
      const key = getRequest.result;
      if (!key) {
        resolve(); // Game not found, nothing to delete
        return;
      }

      const deleteRequest = store.delete(key);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Clear all offline games
 */
export async function clearAllOfflineGames(): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get total storage used
 */
export async function getStorageUsed(): Promise<number> {
  const games = await getAllOfflineGames();
  return games.reduce((total, game) => total + (game.fileSize || 0), 0);
}

/**
 * Update play count
 */
export async function incrementPlayCount(gameId: number): Promise<void> {
  const game = await getOfflineGame(gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  await updateOfflineGame(game.id, {
    playCount: game.playCount + 1,
    lastPlayedAt: new Date(),
  });
}

/**
 * Check if game is available offline
 */
export async function isGameAvailableOffline(gameId: number): Promise<boolean> {
  const game = await getOfflineGame(gameId);
  return game !== null && game.gameData !== undefined;
}

/**
 * Download game data as Blob
 */
export async function downloadGameData(gameUrl: string, onProgress?: (progress: number) => void): Promise<Blob> {
  const response = await fetch(gameUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to download game: ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const chunks: Uint8Array[] = [];
  let receivedLength = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    if (onProgress && total > 0) {
      onProgress((receivedLength / total) * 100);
    }
  }

  // Concatenate chunks into single Uint8Array
  const allChunks = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }

  return new Blob([allChunks]);
}

export default {
  saveOfflineGame,
  getOfflineGame,
  getAllOfflineGames,
  updateOfflineGame,
  deleteOfflineGame,
  clearAllOfflineGames,
  getStorageUsed,
  incrementPlayCount,
  isGameAvailableOffline,
  downloadGameData,
};

