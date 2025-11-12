/**
 * JWT Token Utilities
 * JWT 令牌工具函数
 * 
 * This module provides utilities for JWT token generation, verification,
 * and extraction. It handles authentication tokens and refresh tokens
 * for the GameHub application.
 * 
 * 此模块提供 JWT 令牌生成、验证和提取的工具函数。
 * 它处理 GameHub 应用程序的认证令牌和刷新令牌。
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import * as jwt from 'jsonwebtoken'
import { env } from '../config/env'

// JWT configuration from environment
// 从环境变量获取 JWT 配置
const JWT_SECRET = env.JWT_SECRET
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET
const JWT_REFRESH_EXPIRES_IN = env.JWT_REFRESH_EXPIRES_IN

/**
 * JWT Payload Interface
 * JWT 载荷接口
 */
export interface JwtPayload {
  id: string
  email: string
  role: string
  iat?: number
  exp?: number
}

/**
 * Generate JWT access token
 * 生成 JWT 访问令牌
 * 
 * @param payload - User payload for token
 *                  用户令牌载荷
 * @returns JWT access token
 *          JWT 访问令牌
 */
export const generateToken = (payload: {
  id: string
  email: string
  role: string
}): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions)
}

/**
 * Verify JWT access token
 * 验证 JWT 访问令牌
 * 
 * @param token - JWT token to verify
 *                要验证的 JWT 令牌
 * @returns Decoded token payload
 *          解码的令牌载荷
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

/**
 * Generate JWT refresh token
 * 生成 JWT 刷新令牌
 * 
 * @param payload - User payload for refresh token
 *                  用户刷新令牌载荷
 * @returns JWT refresh token
 *          JWT 刷新令牌
 */
export const generateRefreshToken = (payload: {
  id: string
  email: string
}): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
  } as jwt.SignOptions)
}

/**
 * 从请求头中提取令牌
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null
  }
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}