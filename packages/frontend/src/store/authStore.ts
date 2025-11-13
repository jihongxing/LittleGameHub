/**
 * Authentication Store
 * Task: T030
 * 
 * Global state management for user authentication using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../services/api/client';

export interface User {
  id: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  point_balance: number;
  membership_status: 'free' | 'member' | 'offline_member';
  level: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  auth_method: 'phone' | 'email' | 'wechat' | 'qq' | 'apple';
  identifier: string;
  password?: string;
  verification_code?: string;
  nickname: string;
}

/**
 * Authentication store with Zustand
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      /**
       * Set user data
       */
      setUser: user => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      /**
       * Login with email/password
       */
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post<{
            user_id: string;
            access_token: string;
            refresh_token: string;
          }>('/auth/login', {
            auth_method: 'email',
            identifier: email,
            password,
          });

          // Store tokens
          apiClient.setToken(response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);

          // Fetch user data
          await get().refreshUser();
        } catch (error: any) {
          throw new Error(error.message || 'Login failed');
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Register new user
       */
      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post<{
            user_id: string;
            access_token: string;
            refresh_token: string;
          }>('/auth/register', data);

          // Store tokens
          apiClient.setToken(response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);

          // Fetch user data
          await get().refreshUser();
        } catch (error: any) {
          throw new Error(error.message || 'Registration failed');
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Logout user
       */
      logout: () => {
        apiClient.clearAuth();
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      /**
       * Refresh user data
       */
      refreshUser: async () => {
        try {
          const user = await apiClient.get<User>('/users/me');
          set({
            user,
            isAuthenticated: true,
          });
        } catch (error) {
          // If refresh fails, clear auth
          get().logout();
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Export convenience hooks
export const useUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useAuthActions = () => useAuthStore(state => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  refreshUser: state.refreshUser,
}));
