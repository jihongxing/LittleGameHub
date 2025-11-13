/**
 * 认证状态管理
 * Authentication State Management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/services/api/client';

interface User {
  id: string;
  nickname: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (nickname: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // 登录
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/login', {
            email,
            password,
          });

          const { user, token } = response.data;
          
          // 设置API客户端的token
          apiClient.setToken(token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.message || '登录失败');
        }
      },

      // 注册
      register: async (nickname: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/auth/register', {
            nickname,
            email,
            password,
          });

          const { user, token } = response.data;
          
          // 设置API客户端的token
          apiClient.setToken(token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.message || '注册失败');
        }
      },

      // 登出
      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch (error) {
          // 忽略登出API错误
        } finally {
          // 清除本地状态
          apiClient.clearAuth();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // 设置用户信息
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      // 设置token
      setToken: (token: string) => {
        apiClient.setToken(token);
        set({ token, isAuthenticated: true });
      },

      // 清除认证信息
      clearAuth: () => {
        apiClient.clearAuth();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // 恢复时设置API客户端的token
        if (state?.token) {
          apiClient.setToken(state.token);
        }
      },
    }
  )
);
