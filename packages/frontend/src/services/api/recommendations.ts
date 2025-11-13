/**
 * Recommendations API Service
 * T145: Create recommendations API service
 */

import apiClient from './client';

export interface Recommendation {
  game_id: string;
  score: number;
  reason: string;
  type: 'popular' | 'similar' | 'personalized' | 'scenario' | 'trending';
}

export interface ScenarioConfig {
  scenario: string;
  description: string;
  max_duration: number;
  categories: string[];
}

/**
 * Get personalized recommendations
 */
export const getRecommendations = async (options?: {
  limit?: number;
  scenario?: string;
  exclude?: string[];
}): Promise<{
  recommendations: Recommendation[];
  scenario: string;
}> => {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.scenario) params.append('scenario', options.scenario);
  if (options?.exclude && options.exclude.length > 0) {
    params.append('exclude', options.exclude.join(','));
  }

  const response = await apiClient.get(`/recommendations?${params.toString()}`);
  return response.data;
};

/**
 * Get available scenarios
 */
export const getScenarios = async (): Promise<{
  scenarios: ScenarioConfig[];
  current_scenario: string;
}> => {
  const response = await apiClient.get('/recommendations/scenarios');
  return response.data;
};

/**
 * Get scenario-based recommendations
 */
export const getScenarioRecommendations = async (
  scenario: string,
  options?: {
    limit?: number;
    exclude?: string[];
  }
): Promise<{
  recommendations: Recommendation[];
  scenario_config: ScenarioConfig | null;
}> => {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.exclude && options.exclude.length > 0) {
    params.append('exclude', options.exclude.join(','));
  }

  const response = await apiClient.get(
    `/recommendations/scenario/${scenario}?${params.toString()}`
  );
  return response.data;
};

/**
 * Track recommendation click
 */
export const trackRecommendationClick = async (
  recommendationId: string
): Promise<void> => {
  await apiClient.post(`/recommendations/${recommendationId}/click`);
};

/**
 * Track game play from recommendation
 */
export const trackRecommendationPlay = async (gameId: string): Promise<void> => {
  await apiClient.post(`/recommendations/track-play?game_id=${gameId}`);
};

