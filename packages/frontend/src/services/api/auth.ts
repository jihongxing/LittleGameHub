/**
 * 认证API服务
 * Authentication API Service
 */

import apiClient from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nickname: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    user: {
      id: string;
      nickname: string;
      email: string;
      avatar?: string;
      role?: string;
    };
    token: string;
  };
}

/**
 * 用户登录
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  return await apiClient.post<AuthResponse>('/auth/login', data);
};

/**
 * 用户注册
 */
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  return await apiClient.post<AuthResponse>('/auth/register', data);
};

/**
 * 用户登出
 */
export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

/**
 * 刷新token
 */
export const refreshToken = async (): Promise<{ token: string }> => {
  return await apiClient.post<{ token: string }>('/auth/refresh');
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async () => {
  return await apiClient.get('/auth/me');
};
