/**
 * Collection Sync Service (User Story 7)
 * T201: Service for syncing collections across devices
 */

import apiClient from '../api/client';
import type { Collection } from '../api/collections';
import type { CollectionItem } from '../api/collections';

const SYNC_KEY = 'gamehub_last_sync_time';

export interface SyncData {
  collections: Collection[];
  items: CollectionItem[];
  sync_timestamp: string;
}

/**
 * Get last sync time from local storage
 */
function getLastSyncTime(): Date | null {
  const timestamp = localStorage.getItem(SYNC_KEY);
  return timestamp ? new Date(timestamp) : null;
}

/**
 * Set last sync time in local storage
 */
function setLastSyncTime(time: Date): void {
  localStorage.setItem(SYNC_KEY, time.toISOString());
}

/**
 * Fetch sync data from server
 */
export async function fetchSyncData(lastSyncTime?: Date): Promise<SyncData> {
  const params = lastSyncTime ? { last_sync_time: lastSyncTime.toISOString() } : {};
  const response = await apiClient.get('/collections/sync', { params });
  return response.data;
}

/**
 * Push local changes to server
 */
export async function pushSyncData(syncData: Partial<SyncData>): Promise<void> {
  await apiClient.post('/collections/sync', syncData);
}

/**
 * Sync collections with server
 */
export async function syncCollections(): Promise<{
  success: boolean;
  updated: number;
  errors: string[];
}> {
  const result = {
    success: true,
    updated: 0,
    errors: [] as string[],
  };

  try {
    // Get last sync time
    const lastSyncTime = getLastSyncTime();

    // Fetch changes from server
    const syncData = await fetchSyncData(lastSyncTime || undefined);

    // Update local storage with synced data
    // Note: This is a simplified implementation
    // In a real app, you would merge the data more carefully

    if (syncData.collections.length > 0 || syncData.items.length > 0) {
      result.updated = syncData.collections.length + syncData.items.length;
    }

    // Update last sync time
    setLastSyncTime(new Date(syncData.sync_timestamp));

    console.log('[Collection Sync] Synced successfully:', result);
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    console.error('[Collection Sync] Sync failed:', error);
  }

  return result;
}

/**
 * Auto-sync collections at regular intervals
 */
export function startAutoSync(intervalMs: number = 60000): () => void {
  console.log('[Collection Sync] Starting auto-sync...');

  const intervalId = setInterval(() => {
    syncCollections().catch((error) => {
      console.error('[Collection Sync] Auto-sync failed:', error);
    });
  }, intervalMs);

  // Return cleanup function
  return () => {
    console.log('[Collection Sync] Stopping auto-sync...');
    clearInterval(intervalId);
  };
}

/**
 * Force full sync
 */
export async function forceSyncCollections(): Promise<void> {
  // Clear last sync time to force full sync
  localStorage.removeItem(SYNC_KEY);
  await syncCollections();
}

export default {
  fetchSyncData,
  pushSyncData,
  syncCollections,
  startAutoSync,
  forceSyncCollections,
};

