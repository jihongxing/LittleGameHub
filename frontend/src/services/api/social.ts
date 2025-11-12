/**
 * Social API Service (User Story 6)
 * T165: Frontend API client for social features
 */

import apiClient from './client';

// ==================== Types ====================

export interface Friend {
  id: number;
  user_id: number;
  friend_id: number;
  friend_user_id: number;
  friend_username: string;
  friend_email: string;
  friend_avatar?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  nickname?: string;
  accepted_at?: string;
  last_interaction_at?: string;
  created_at: string;
}

export interface FriendRequest {
  id: number;
  user_id: number;
  friend_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username?: string;
  avatar?: string;
  score: number;
  games_played?: number;
  last_played_at?: string;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  current_user_rank?: number;
  total: number;
  page: number;
  limit: number;
}

export interface FriendActivity {
  id: number;
  friend_id: number;
  friend_username: string;
  friend_avatar?: string;
  activity_type: 'game_completed' | 'achievement_unlocked' | 'challenge_won' | 'new_high_score';
  game_id?: number;
  game_title?: string;
  score?: number;
  achievement_name?: string;
  timestamp: string;
}

export interface GameChallenge {
  id: number;
  challenger_id: number;
  challenged_id: number;
  game_id: number;
  challenge_type: 'high_score' | 'time_attack' | 'completion' | 'custom';
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired';
  target_value?: number;
  challenger_score?: number;
  challenged_score?: number;
  winner_id?: number;
  message?: string;
  expires_at?: string;
  created_at: string;
}

// ==================== Friend Management ====================

/**
 * Get list of friends
 */
export async function getFriends(params?: {
  status?: 'pending' | 'accepted' | 'rejected' | 'blocked';
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  friends: Friend[];
  total: number;
  page: number;
  limit: number;
}> {
  const response = await apiClient.get('/friends', { params });
  return response.data.data;
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(friendId: number, message?: string): Promise<FriendRequest> {
  const response = await apiClient.post('/friends/requests', {
    friend_id: friendId,
    message,
  });
  return response.data.data;
}

/**
 * Get pending friend requests
 */
export async function getPendingRequests(): Promise<{
  requests: FriendRequest[];
  total: number;
}> {
  const response = await apiClient.get('/friends/requests/pending');
  return response.data.data;
}

/**
 * Get sent friend requests
 */
export async function getSentRequests(): Promise<{
  requests: FriendRequest[];
  total: number;
}> {
  const response = await apiClient.get('/friends/requests/sent');
  return response.data.data;
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(requestId: number): Promise<FriendRequest> {
  const response = await apiClient.patch(`/friends/requests/${requestId}/accept`);
  return response.data.data;
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(requestId: number): Promise<FriendRequest> {
  const response = await apiClient.patch(`/friends/requests/${requestId}/reject`);
  return response.data.data;
}

/**
 * Remove a friend
 */
export async function removeFriend(friendId: number): Promise<void> {
  await apiClient.delete(`/friends/${friendId}`);
}

/**
 * Block a user
 */
export async function blockUser(userId: number): Promise<void> {
  await apiClient.post(`/friends/${userId}/block`);
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: number): Promise<void> {
  await apiClient.delete(`/friends/${userId}/block`);
}

/**
 * Update friend nickname
 */
export async function updateFriendNickname(friendId: number, nickname: string): Promise<Friend> {
  const response = await apiClient.patch(`/friends/${friendId}/nickname`, { nickname });
  return response.data.data;
}

/**
 * Check if users are friends
 */
export async function checkFriendship(friendId: number): Promise<boolean> {
  const response = await apiClient.get(`/friends/${friendId}/check`);
  return response.data.data.are_friends;
}

// ==================== Friend Activity ====================

/**
 * Get friend activity feed
 */
export async function getFriendActivity(limit = 20): Promise<{
  activities: FriendActivity[];
  total: number;
}> {
  const response = await apiClient.get('/friends/activity', {
    params: { limit },
  });
  return response.data.data;
}

// ==================== Leaderboards ====================

/**
 * Get leaderboard
 */
export async function getLeaderboard(params: {
  game_id?: number;
  scope?: 'global' | 'friends';
  time_range?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  page?: number;
  limit?: number;
}): Promise<LeaderboardResponse> {
  const response = await apiClient.get('/leaderboards', { params });
  return response.data.data;
}

/**
 * Get top players
 */
export async function getTopPlayers(gameId?: number, limit = 10): Promise<{
  top_players: LeaderboardEntry[];
  total: number;
}> {
  const response = await apiClient.get('/leaderboards/top', {
    params: { game_id: gameId, limit },
  });
  return response.data.data;
}

/**
 * Get user's rank
 */
export async function getUserRank(params?: {
  game_id?: number;
  scope?: 'global' | 'friends';
  time_range?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}): Promise<{
  user_id: number;
  rank: number | null;
  game_id?: number;
  scope: string;
  time_range: string;
}> {
  const response = await apiClient.get('/leaderboards/rank', { params });
  return response.data.data;
}

/**
 * Get nearby rankings
 */
export async function getNearbyRankings(params?: {
  game_id?: number;
  range?: number;
}): Promise<{
  above: LeaderboardEntry[];
  current: LeaderboardEntry | null;
  below: LeaderboardEntry[];
}> {
  const response = await apiClient.get('/leaderboards/nearby', { params });
  return response.data.data;
}

/**
 * Get leaderboard for a specific game
 */
export async function getGameLeaderboard(
  gameId: number,
  params?: {
    scope?: 'global' | 'friends';
    time_range?: 'daily' | 'weekly' | 'monthly' | 'all_time';
    page?: number;
    limit?: number;
  },
): Promise<LeaderboardResponse> {
  const response = await apiClient.get(`/leaderboards/games/${gameId}`, { params });
  return response.data.data;
}

// ==================== Game Challenges ====================

/**
 * Get game challenges
 */
export async function getChallenges(params?: {
  status?: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired';
  game_id?: number;
  page?: number;
  limit?: number;
}): Promise<{
  challenges: GameChallenge[];
  total: number;
  page: number;
  limit: number;
}> {
  const response = await apiClient.get('/challenges', { params });
  return response.data.data;
}

/**
 * Create a game challenge
 */
export async function createChallenge(params: {
  challenged_id: number;
  game_id: number;
  challenge_type: 'high_score' | 'time_attack' | 'completion' | 'custom';
  target_value?: number;
  message?: string;
  expires_in_hours?: number;
}): Promise<GameChallenge> {
  const response = await apiClient.post('/challenges', params);
  return response.data.data;
}

/**
 * Accept a challenge
 */
export async function acceptChallenge(challengeId: number): Promise<GameChallenge> {
  const response = await apiClient.patch(`/challenges/${challengeId}/accept`);
  return response.data.data;
}

/**
 * Decline a challenge
 */
export async function declineChallenge(challengeId: number): Promise<GameChallenge> {
  const response = await apiClient.patch(`/challenges/${challengeId}/decline`);
  return response.data.data;
}

/**
 * Get active challenges
 */
export async function getActiveChallenges(): Promise<GameChallenge[]> {
  const response = await apiClient.get('/challenges/active');
  return response.data.data;
}

/**
 * Get challenge statistics
 */
export async function getChallengeStats(): Promise<{
  total_challenges: number;
  challenges_won: number;
  challenges_lost: number;
  challenges_tied: number;
  win_rate: number;
}> {
  const response = await apiClient.get('/challenges/stats');
  return response.data.data;
}

export default {
  // Friend Management
  getFriends,
  sendFriendRequest,
  getPendingRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  updateFriendNickname,
  checkFriendship,
  
  // Friend Activity
  getFriendActivity,
  
  // Leaderboards
  getLeaderboard,
  getTopPlayers,
  getUserRank,
  getNearbyRankings,
  getGameLeaderboard,
  
  // Game Challenges
  getChallenges,
  createChallenge,
  acceptChallenge,
  declineChallenge,
  getActiveChallenges,
  getChallengeStats,
};

