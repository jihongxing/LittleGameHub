/**
 * OAuth Hook
 * OAuth Hook
 *
 * Provides OAuth authentication functionality
 * 提供OAuth认证功能
 */

import { useState, useCallback } from 'react';
import { OAuthProvider } from '../components/auth/OAuthLoginButton';
import { useNavigate } from 'react-router-dom';
import { oauthApi } from '../services/api/oauth';

export interface OAuthState {
  /** 是否正在处理OAuth登录 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 当前处理的提供商 */
  currentProvider: OAuthProvider | null;
}

/**
 * OAuth Hook
 * OAuth Hook
 */
export const useOAuth = () => {
  const [state, setState] = useState<OAuthState>({
    loading: false,
    error: null,
    currentProvider: null,
  });

  const navigate = useNavigate();

  /**
   * 发起OAuth登录
   */
  const loginWithOAuth = useCallback(async (provider: OAuthProvider) => {
    try {
      setState({
        loading: true,
        error: null,
        currentProvider: provider,
      });

      // 获取OAuth授权URL
      const { url } = await oauthApi.getAuthorizationUrl(provider);

      // 重定向到OAuth提供商
      window.location.href = url;

    } catch (error) {
      console.error('OAuth login error:', error);
      setState({
        loading: false,
        error: error instanceof Error ? error.message : '登录失败，请重试',
        currentProvider: null,
      });
    }
  }, []);

  /**
   * 处理OAuth回调
   */
  const handleOAuthCallback = useCallback(async (code: string, state: string, provider: OAuthProvider) => {
    try {
      setState({
        loading: true,
        error: null,
        currentProvider: provider,
      });

      // 调用OAuth API处理回调
      const result = await oauthApi.handleCallback({ code, state, provider });

      // 登录成功，保存token并重定向
      if (result.token) {
        localStorage.setItem('auth_token', result.token);

        // 根据是否为新用户重定向到不同页面
        if (result.isNewUser) {
          navigate('/welcome', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }

      setState({
        loading: false,
        error: null,
        currentProvider: null,
      });

      return result;

    } catch (error) {
      console.error('OAuth callback error:', error);
      setState({
        loading: false,
        error: error instanceof Error ? error.message : '登录失败，请重试',
        currentProvider: null,
      });
      throw error;
    }
  }, [navigate]);

  /**
   * 取消OAuth登录
   */
  const cancelOAuth = useCallback(() => {
    setState({
      loading: false,
      error: null,
      currentProvider: null,
    });
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    loginWithOAuth,
    handleOAuthCallback,
    cancelOAuth,
    clearError,
  };
};

export default useOAuth;
