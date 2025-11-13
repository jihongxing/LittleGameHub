/**
 * OAuth API Service
 * OAuth API 服务
 *
 * Handles OAuth-related API calls
 * 处理OAuth相关的API调用
 */

import { apiClient } from './client';
import { OAuthProvider } from '../../components/auth/OAuthLoginButton';

export interface OAuthConnection {
  provider: OAuthProvider;
  displayName: string;
  email?: string;
  connected: boolean;
  lastLoginAt?: string;
  isPrimary?: boolean;
}

export interface OAuthCallbackParams {
  code: string;
  state: string;
  provider: OAuthProvider;
}

export interface OAuthCallbackResponse {
  token: string;
  user: {
    id: string;
    nickname: string;
    email?: string;
    avatar?: string;
  };
  isNewUser: boolean;
}

/**
 * OAuth API Service Class
 * OAuth API 服务类
 */
export class OAuthApiService {
  /**
   * 获取OAuth授权URL
   */
  async getAuthorizationUrl(provider: OAuthProvider): Promise<{ url: string; state: string }> {
    const response = await apiClient.get(`/auth/oauth/${provider}`);
    return response.data;
  }

  /**
   * 处理OAuth回调
   */
  async handleCallback(params: OAuthCallbackParams): Promise<OAuthCallbackResponse> {
    const response = await apiClient.post(`/auth/oauth/${params.provider}/callback`, params);
    return response.data;
  }

  /**
   * 获取用户的OAuth连接状态
   */
  async getConnections(): Promise<{ connections: OAuthConnection[] }> {
    const response = await apiClient.get('/auth/oauth/connections');
    return response.data;
  }

  /**
   * 断开OAuth连接
   */
  async disconnect(provider: OAuthProvider): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/oauth/disconnect', { provider });
    return response.data;
  }

  /**
   * 设置主登录方式
   */
  async setPrimary(provider: OAuthProvider): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/oauth/set-primary', { provider });
    return response.data;
  }

  /**
   * 验证OAuth令牌
   */
  async validateToken(provider: OAuthProvider, accessToken: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/auth/oauth/validate-token', {
        provider,
        accessToken,
      });
      return response.data.valid;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const oauthApi = new OAuthApiService();
export default oauthApi;
