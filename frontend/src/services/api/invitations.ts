/**
 * Invitations API Service
 * T130: Create invitations API service
 */

import apiClient from './client';

export interface Invitation {
  id: string;
  inviter_id: string;
  invitee_id: string | null;
  invitation_code: string;
  invitation_link: string;
  status: 'pending' | 'accepted' | 'rewarded' | 'expired';
  points_awarded: number;
  reward_milestones: Record<string, boolean>;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerateInvitationResponse {
  invitation_id: string;
  invitation_code: string;
  invitation_link: string;
  qr_code_url: string;
}

export interface InvitationStats {
  total_invitations: number;
  accepted_invitations: number;
  pending_invitations: number;
  total_points_earned: number;
  conversion_rate: number;
}

export interface RewardMilestone {
  type: string;
  points: number;
  description: string;
}

export interface LeaderboardEntry {
  user_id: string;
  total_invitations: number;
  total_points: number;
  rank: number;
}

/**
 * Generate new invitation link
 */
export const generateInvitation = async (): Promise<GenerateInvitationResponse> => {
  const response = await apiClient.post('/invitations/generate');
  return response.data;
};

/**
 * Get user's invitations
 */
export const getUserInvitations = async (options?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  invitations: Invitation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}> => {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));

  const response = await apiClient.get(`/invitations?${params.toString()}`);
  return response.data;
};

/**
 * Get invitation statistics
 */
export const getInvitationStats = async (): Promise<InvitationStats> => {
  const response = await apiClient.get('/invitations/stats');
  return response.data;
};

/**
 * Get invitation leaderboard
 */
export const getInvitationLeaderboard = async (
  limit: number = 10
): Promise<{ leaderboard: LeaderboardEntry[] }> => {
  const response = await apiClient.get(`/invitations/leaderboard?limit=${limit}`);
  return response.data;
};

/**
 * Get reward milestones
 */
export const getRewardMilestones = async (): Promise<{
  milestones: RewardMilestone[];
  total_potential_rewards: number;
}> => {
  const response = await apiClient.get('/invitations/rewards');
  return response.data;
};

/**
 * Validate invitation code
 */
export const validateInvitationCode = async (
  code: string
): Promise<{
  valid: boolean;
  message: string;
  invitation?: Invitation;
}> => {
  const response = await apiClient.get(`/invitations/validate/${code}`);
  return response.data;
};

/**
 * Get QR code URL for invitation
 */
export const getQRCodeUrl = (code: string): string => {
  return `/api/invitations/qr/${code}`;
};

