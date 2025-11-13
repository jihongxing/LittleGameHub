/**
 * Achievements API Service (User Story 8)
 * T211: Create achievements API service
 */

import apiClient from './client';

export interface Achievement {
  id: number;
  title: string;
  description: string;
  category: string;
  trigger_type: string;
  trigger_threshold: number;
  points_reward: number;
  icon_url?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_hidden: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AchievementProgress {
  achievement: Achievement;
  unlocked: boolean;
  progress: number;
  unlocked_at?: string;
}

export interface AchievementStats {
  total: number;
  unlocked: number;
  locked: number;
  points_earned: number;
  completion_percentage: number;
}

export interface UserAchievementsResponse {
  achievements: AchievementProgress[];
  stats: AchievementStats;
}

export interface CategoryStats {
  [category: string]: {
    total: number;
    unlocked: number;
  };
}

/**
 * Get all achievements
 */
export async function getAllAchievements(includeHidden: boolean = false): Promise<{
  achievements: Achievement[];
  total: number;
}> {
  const response = await apiClient.get('/achievements', {
    params: { includeHidden },
  });
  return response.data;
}

/**
 * Get achievement by ID
 */
export async function getAchievementById(id: number): Promise<Achievement> {
  const response = await apiClient.get(`/achievements/${id}`);
  return response.data;
}

/**
 * Get achievements by category
 */
export async function getAchievementsByCategory(category: string): Promise<{
  achievements: Achievement[];
  category: string;
  total: number;
}> {
  const response = await apiClient.get(`/achievements/category/${category}`);
  return response.data;
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(userId?: number): Promise<UserAchievementsResponse> {
  const endpoint = userId ? `/achievements/user/${userId}` : '/achievements/me';
  const response = await apiClient.get(endpoint);
  return response.data;
}

/**
 * Get recently unlocked achievements
 */
export async function getRecentlyUnlocked(
  userId: number,
  limit: number = 5,
): Promise<{
  achievements: AchievementProgress[];
  total: number;
}> {
  const response = await apiClient.get(`/achievements/user/${userId}/recent`, {
    params: { limit },
  });
  return response.data;
}

/**
 * Get achievement statistics by category
 */
export async function getStatsByCategory(userId: number): Promise<{
  stats: CategoryStats;
}> {
  const response = await apiClient.get(`/achievements/user/${userId}/stats`);
  return response.data;
}

/**
 * Unlock achievement for user
 */
export async function unlockAchievement(
  achievementId: number,
  userId: number,
  metadata?: any,
): Promise<{
  unlocked: boolean;
  achievement: Achievement;
  reward_points: number;
}> {
  const response = await apiClient.post('/achievements/unlock', {
    user_id: userId,
    achievement_id: achievementId,
    metadata,
  });
  return response.data;
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  achievementId: number,
  userId: number,
  progress: number,
): Promise<{ success: boolean }> {
  const response = await apiClient.post('/achievements/progress', {
    user_id: userId,
    achievement_id: achievementId,
    progress,
  });
  return response.data;
}

/**
 * Check and unlock achievements based on activity
 */
export async function checkAchievements(
  userId: number,
  activityType: string,
  value: number,
  metadata?: any,
): Promise<{
  unlocked: Achievement[];
  count: number;
}> {
  const response = await apiClient.post('/achievements/check', {
    user_id: userId,
    activity_type: activityType,
    value,
    metadata,
  });
  return response.data;
}

/**
 * Get suggested achievements for user
 */
export async function getSuggestedAchievements(
  userId: number,
  limit: number = 3,
): Promise<{
  suggestions: Achievement[];
  total: number;
}> {
  const response = await apiClient.get(`/achievements/user/${userId}/suggestions`, {
    params: { limit },
  });
  return response.data;
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: string): string {
  const colors: { [key: string]: string } = {
    common: '#808080',
    rare: '#4169E1',
    epic: '#9400D3',
    legendary: '#FFD700',
  };
  return colors[rarity] || colors.common;
}

/**
 * Get rarity label
 */
export function getRarityLabel(rarity: string): string {
  const labels: { [key: string]: string } = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  };
  return labels[rarity] || '普通';
}

/**
 * Get category label
 */
export function getCategoryLabel(category: string): string {
  const labels: { [key: string]: string } = {
    gameplay: '游戏',
    points: '积分',
    social: '社交',
    collection: '收藏',
    membership: '会员',
    streak: '连续',
    special: '特殊',
  };
  return labels[category] || category;
}

export default {
  getAllAchievements,
  getAchievementById,
  getAchievementsByCategory,
  getUserAchievements,
  getRecentlyUnlocked,
  getStatsByCategory,
  unlockAchievement,
  updateAchievementProgress,
  checkAchievements,
  getSuggestedAchievements,
  getRarityColor,
  getRarityLabel,
  getCategoryLabel,
};

