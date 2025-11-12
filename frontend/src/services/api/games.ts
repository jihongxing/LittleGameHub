/**
 * Games API Service
 * Client-side API calls for games and game sessions
 * T051: Create games API service
 */

import apiClient from './client';

/**
 * Game interfaces
 */
export interface Game {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  game_url?: string;
  category_tags: string[];
  point_reward_rules: {
    base_points: number;
    min_duration_seconds: number;
    points_per_minute: number;
    max_points_per_session: number;
  };
  min_play_duration_seconds: number;
  availability_status: 'active' | 'inactive' | 'maintenance';
  is_featured: boolean;
  play_count: number;
  average_rating: number | null;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedGamesResponse {
  games: Game[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface GameSession {
  id: string;
  user_id: string;
  game_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  points_earned: number;
  completion_status: 'in_progress' | 'completed' | 'abandoned';
  game_state: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface StartSessionResponse {
  session_id: string;
  game_id: string;
  start_time: string;
}

export interface EndSessionResponse {
  session_id: string;
  points_earned: number;
  new_balance: number;
}

/**
 * Get games with filtering and pagination
 * @param options Query options
 * @returns Paginated games response
 */
export const getGames = async (options?: {
  category?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: 'popular' | 'latest' | 'rating';
}): Promise<PaginatedGamesResponse> => {
  const params = new URLSearchParams();

  if (options?.category) params.append('category', options.category);
  if (options?.search) params.append('search', options.search);
  if (options?.status) params.append('status', options.status);
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.sort) params.append('sort', options.sort);

  const response = await apiClient.get<PaginatedGamesResponse>(
    `/games?${params.toString()}`
  );
  return response;
};

/**
 * Get game by ID
 * @param gameId Game UUID
 * @returns Game details
 */
export const getGameById = async (gameId: string): Promise<Game> => {
  const response = await apiClient.get<Game>(`/games/${gameId}`);
  return response;
};

/**
 * Get featured games
 * @param limit Number of games to return
 * @returns Array of featured games
 */
export const getFeaturedGames = async (limit?: number): Promise<Game[]> => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', String(limit));

  const response = await apiClient.get<{ games: Game[] }>(
    `/games/featured/list?${params.toString()}`
  );
  return response.games;
};

/**
 * Get games by category
 * @param category Category name
 * @param limit Number of games to return
 * @returns Array of games
 */
export const getGamesByCategory = async (
  category: string,
  limit?: number
): Promise<Game[]> => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', String(limit));

  const response = await apiClient.get<{ games: Game[] }>(
    `/games/categories/${category}?${params.toString()}`
  );
  return response.games;
};

/**
 * Start a game session
 * @param gameId Game UUID
 * @returns Session information
 */
export const startGameSession = async (
  gameId: string
): Promise<StartSessionResponse> => {
  const response = await apiClient.post<StartSessionResponse>(
    `/games/${gameId}/sessions`,
    {}
  );
  return response;
};

/**
 * Update/end a game session
 * @param gameId Game UUID
 * @param sessionId Session UUID
 * @param data Session update data
 * @returns Updated session with points earned
 */
export const updateGameSession = async (
  gameId: string,
  sessionId: string,
  data: {
    end_time?: string;
    duration_seconds?: number;
    completion_status?: 'in_progress' | 'completed' | 'abandoned';
    game_state?: Record<string, any>;
  }
): Promise<EndSessionResponse> => {
  const response = await apiClient.patch<EndSessionResponse>(
    `/games/${gameId}/sessions/${sessionId}`,
    data
  );
  return response;
};

/**
 * Get user's game session history
 * @param options Query options
 * @returns Array of sessions
 */
export const getUserSessions = async (options?: {
  game_id?: string;
  status?: string;
  limit?: number;
}): Promise<GameSession[]> => {
  const params = new URLSearchParams();

  if (options?.game_id) params.append('game_id', options.game_id);
  if (options?.status) params.append('status', options.status);
  if (options?.limit) params.append('limit', String(options.limit));

  const response = await apiClient.get<{ sessions: GameSession[] }>(
    `/games/sessions/history?${params.toString()}`
  );
  return response.sessions;
};

/**
 * Get user's active game sessions
 * @returns Array of active sessions
 */
export const getActiveSessions = async (): Promise<GameSession[]> => {
  const response = await apiClient.get<{ sessions: GameSession[] }>(
    '/games/sessions/active'
  );
  return response.sessions;
};

/**
 * Get game statistics
 * @param gameId Game UUID
 * @returns Game statistics
 */
export const getGameStatistics = async (gameId: string): Promise<{
  play_count: number;
  average_rating: number | null;
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  abandoned_sessions: number;
  average_duration_seconds: number;
  total_points_earned: number;
}> => {
  const response = await apiClient.get(`/games/${gameId}/statistics`);
  return response.data;
};
