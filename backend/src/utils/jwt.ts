import jwt from 'jsonwebtoken'
import { User } from '@/types'

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

/**
 * 生成JWT令牌
 */
export const generateToken = (payload: {
  id: string
  email: string
  role: string
}): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

/**
 * 验证JWT令牌
 */
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET)
}

/**
 * 生成刷新令牌
 */
export const generateRefreshToken = (payload: {
  id: string
  email: string
}): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d'
  })
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