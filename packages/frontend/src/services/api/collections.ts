/**
 * Collections API Service (User Story 7)
 * T191: Frontend API client for collections
 */

import apiClient from './client';

export interface Collection {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  is_public: boolean;
  cover_image_url?: string;
  category?: string;
  game_count: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: number;
  collection_id: number;
  game_id: number;
  note?: string;
  sort_order: number;
  added_at: string;
}

export async function getCollections(params?: {
  is_public?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  collections: Collection[];
  total: number;
  page: number;
  limit: number;
}> {
  const response = await apiClient.get('/collections', { params });
  return response.data;
}

export async function createCollection(data: {
  name: string;
  description?: string;
  is_public?: boolean;
}): Promise<Collection> {
  const response = await apiClient.post('/collections', data);
  return response.data;
}

export async function updateCollection(id: number, data: Partial<Collection>): Promise<Collection> {
  const response = await apiClient.put(`/collections/${id}`, data);
  return response.data;
}

export async function deleteCollection(id: number): Promise<void> {
  await apiClient.delete(`/collections/${id}`);
}

export async function addGameToCollection(collectionId: number, gameId: number): Promise<CollectionItem> {
  const response = await apiClient.post(`/collections/${collectionId}/games`, { game_id: gameId });
  return response.data;
}

export async function removeGameFromCollection(collectionId: number, gameId: number): Promise<void> {
  await apiClient.delete(`/collections/${collectionId}/games/${gameId}`);
}

export async function getCollectionGames(collectionId: number): Promise<{
  games: CollectionItem[];
  total: number;
}> {
  const response = await apiClient.get(`/collections/${collectionId}/games`);
  return response.data;
}

export default {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addGameToCollection,
  removeGameFromCollection,
  getCollectionGames,
};

