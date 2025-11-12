/**
 * Rewards API Service
 * T083: Create rewards API service
 */

import apiClient from './client';

export interface Reward {
  id: string;
  name: string;
  description: string;
  point_cost: number;
  reward_type: 'membership_trial' | 'cash' | 'virtual_item' | 'coupon';
  reward_data: Record<string, any> | null;
  availability_status: 'available' | 'out_of_stock' | 'disabled';
  stock_quantity: number | null;
  total_redeemed: number;
  is_featured: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface RedeemResponse {
  redemption_id: string;
  points_spent: number;
  new_balance: number;
  delivery_status: 'pending' | 'processing' | 'delivered' | 'failed';
  confirmation_code: string;
}

export interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  redemption_date: string;
  delivery_status: string;
  delivery_data: Record<string, any> | null;
  confirmation_code: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get available rewards
 */
export const getRewards = async (options?: {
  type?: string;
  min_points?: number;
  max_points?: number;
  featured?: boolean;
}): Promise<{ rewards: Reward[] }> => {
  const params = new URLSearchParams();
  if (options?.type) params.append('type', options.type);
  if (options?.min_points) params.append('min_points', String(options.min_points));
  if (options?.max_points) params.append('max_points', String(options.max_points));
  if (options?.featured) params.append('featured', String(options.featured));

  const response = await apiClient.get(`/rewards?${params.toString()}`);
  return response.data;
};

/**
 * Get reward details
 */
export const getRewardById = async (rewardId: string): Promise<Reward> => {
  const response = await apiClient.get(`/rewards/${rewardId}`);
  return response.data;
};

/**
 * Redeem a reward
 */
export const redeemReward = async (
  rewardId: string,
  confirmation: boolean = true
): Promise<RedeemResponse> => {
  const response = await apiClient.post<RedeemResponse>(
    `/rewards/${rewardId}/redeem`,
    { confirmation }
  );
  return response;
};

/**
 * Get redemption history
 */
export const getRedemptionHistory = async (options?: {
  page?: number;
  limit?: number;
}): Promise<{
  redemptions: Redemption[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}> => {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));

  const response = await apiClient.get(`/rewards/redemptions/history?${params.toString()}`);
  return response.data;
};
