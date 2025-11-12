/**
 * Membership API Service
 * T109: Create membership API service
 */

import apiClient from './client';

export interface MembershipPlan {
  tier: 'free' | 'basic' | 'premium' | 'offline';
  name: string;
  description: string;
  price: number;
  duration_months: number;
  features: string[];
  point_multiplier: number;
}

export interface Membership {
  id: string;
  user_id: string;
  tier: 'free' | 'basic' | 'premium' | 'offline';
  status: 'pending' | 'active' | 'expired' | 'cancelled' | 'refunded';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface MembershipInfo {
  current_membership: Membership | null;
  tier: string;
  point_multiplier: number;
  privileges: {
    ad_free: boolean;
    cloud_save: boolean;
    offline_download: boolean;
    all_games: boolean;
  };
  history: Membership[];
}

export interface SubscriptionRequest {
  tier: 'basic' | 'premium' | 'offline';
  payment_method: 'alipay' | 'wechat_pay' | 'apple_iap';
  return_url?: string;
}

export interface SubscriptionResult {
  subscription: {
    membership_id: string;
    tier: string;
    status: string;
    start_date: string;
    end_date: string;
    payment_required: boolean;
    payment_amount?: number;
  };
  payment?: {
    payment_id: string;
    status: string;
    payment_url?: string;
    qr_code?: string;
    order_id?: string;
  };
}

export interface RefundRequest {
  reason: 'user_request' | 'technical_issue' | 'duplicate_payment' | 'service_not_provided' | 'other';
  description?: string;
}

export interface RefundResult {
  refund: {
    refund_id: string;
    status: string;
    amount: number;
    estimated_days: number;
  };
}

export interface RefundEligibility {
  eligible: boolean;
  reason?: string;
  refund_amount?: number;
}

/**
 * Get available membership plans
 */
export const getMembershipPlans = async (): Promise<{ plans: MembershipPlan[] }> => {
  const response = await apiClient.get('/membership/plans');
  return response.data;
};

/**
 * Get current user's membership information
 */
export const getCurrentMembership = async (): Promise<MembershipInfo> => {
  const response = await apiClient.get('/membership');
  return response.data;
};

/**
 * Subscribe to a membership plan
 */
export const subscribeMembership = async (
  request: SubscriptionRequest
): Promise<SubscriptionResult> => {
  const response = await apiClient.post('/membership/subscribe', request);
  return response.data;
};

/**
 * Cancel membership subscription
 */
export const cancelSubscription = async (): Promise<{ message: string }> => {
  const response = await apiClient.delete('/membership/subscribe');
  return response.data;
};

/**
 * Request refund
 */
export const requestRefund = async (request: RefundRequest): Promise<RefundResult> => {
  const response = await apiClient.post('/membership/refund', request);
  return response.data;
};

/**
 * Check refund eligibility
 */
export const checkRefundEligibility = async (): Promise<RefundEligibility> => {
  const response = await apiClient.get('/membership/refund/eligibility');
  return response.data;
};

/**
 * Query payment status
 */
export const queryPaymentStatus = async (
  paymentId: string
): Promise<{ payment_id: string; status: string }> => {
  const response = await apiClient.post('/webhooks/payment/status', { payment_id: paymentId });
  return response.data;
};

