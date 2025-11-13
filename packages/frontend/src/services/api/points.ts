/**
 * Points API Service
 * T082: Create points API service
 */

import apiClient from './client';

export interface PointBalance {
  balance: number;
  pending: number;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  type: 'earn' | 'spend';
  amount: number;
  source: string;
  source_id: string | null;
  description: string;
  status: string;
  balance_after: number;
  created_at: string;
  updated_at: string;
}

export interface PointTask {
  id: string;
  name: string;
  description: string;
  point_reward: number;
  is_completed: boolean;
  cooldown_until: string | null;
}

export interface CompleteTaskResponse {
  points_earned: number;
  new_balance: number;
  transaction_id: string;
}

/**
 * Get user point balance
 */
export const getPointBalance = async (): Promise<PointBalance> => {
  const response = await apiClient.get<PointBalance>('/points/balance');
  return response;
};

/**
 * Get point transaction history
 */
export const getPointTransactions = async (options?: {
  type?: 'earn' | 'spend';
  page?: number;
  limit?: number;
}): Promise<{
  transactions: PointTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}> => {
  const params = new URLSearchParams();
  if (options?.type) params.append('type', options.type);
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));

  const response = await apiClient.get(`/points/transactions?${params.toString()}`);
  return response.data;
};

/**
 * Get available point tasks
 */
export const getPointTasks = async (): Promise<{ tasks: PointTask[] }> => {
  const response = await apiClient.get('/points/tasks');
  return response.data;
};

/**
 * Complete a point task
 */
export const completeTask = async (
  taskId: string,
  data?: Record<string, any>
): Promise<CompleteTaskResponse> => {
  const response = await apiClient.post<CompleteTaskResponse>(
    `/points/tasks/${taskId}/complete`,
    data || {}
  );
  return response;
};

/**
 * Get point statistics
 */
export const getPointStatistics = async (): Promise<{
  current_balance: number;
  pending: number;
  total_earned: number;
  total_spent: number;
}> => {
  const response = await apiClient.get('/points/statistics');
  return response.data;
};
