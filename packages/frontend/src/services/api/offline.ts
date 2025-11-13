/**
 * Offline Games API Service (User Story 7)
 * T192: Frontend API client for offline games
 */

import apiClient from './client';

export interface OfflineGame {
  id: number;
  user_id: number;
  game_id: number;
  download_status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  file_size?: number;
  downloaded_bytes: number;
  progress_percentage: number;
  created_at: string;
}

export interface StorageQuota {
  used: number;
  total: number;
  available: number;
  percentage_used: number;
  tier: 'free' | 'member' | 'offline_member';
}

export async function getOfflineGames(status?: string): Promise<{
  games: OfflineGame[];
  storage: StorageQuota;
}> {
  const response = await apiClient.get('/offline/games', { params: { status } });
  return response.data;
}

export async function downloadGame(gameId: number): Promise<OfflineGame> {
  const response = await apiClient.post(`/offline/games/${gameId}/download`);
  return response.data;
}

export async function deleteOfflineGame(gameId: number): Promise<void> {
  await apiClient.delete(`/offline/games/${gameId}`);
}

export async function getDownloadProgress(id: number): Promise<OfflineGame> {
  const response = await apiClient.get(`/offline/games/${id}/progress`);
  return response.data;
}

export async function getStorageQuota(): Promise<StorageQuota> {
  const response = await apiClient.get('/offline/storage-quota');
  return response.data;
}

export default {
  getOfflineGames,
  downloadGame,
  deleteOfflineGame,
  getDownloadProgress,
  getStorageQuota,
};

