import { Request, Response, NextFunction } from 'express'
import { verifyToken, extractTokenFromHeader } from '@/utils/jwt'
import { User } from '../modules/users/entities/user.entity'
import { getUserRepository } from '../services/repository.service'
import { AppError } from './errorHandler'
import { tokenBlacklistService } from '@/services/security/token-blacklist.service'

/**
 * 扩展Request接口，添加用户信息
 */
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

/**
 * 认证中间件
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 从请求头中获取令牌
    const token = extractTokenFromHeader(req.headers.authorization)
    
    if (!token) {
      return next(new AppError('未提供认证令牌', 401))
    }

    // 检查令牌是否在黑名单中
    const isBlacklisted = await tokenBlacklistService.isBlacklisted(token)
    if (isBlacklisted) {
      return next(new AppError('令牌已失效，请重新登录', 401))
    }

    // 验证令牌
    const decoded = verifyToken(token)
    
    // 查找用户
    const userRepository = getUserRepository()
    const user = await userRepository.findOne({ 
      where: { id: decoded.id }
    })
    
    if (!user) {
      return next(new AppError('令牌无效，用户不存在', 401))
    }

    // 检查用户是否激活
    if (!user.is_active) {
      return next(new AppError('账户已被禁用', 401))
    }

    // 将用户信息添加到请求对象
    req.user = user
    next()
  } catch (error) {
    return next(new AppError('令牌无效', 401))
  }
}

/**
 * 可选认证中间件（不强制要求认证）
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 从请求头中获取令牌
    const token = extractTokenFromHeader(req.headers.authorization)
    
    if (!token) {
      return next()
    }

    // 验证令牌
    const decoded = verifyToken(token)
    
    // 查找用户
    const userRepository = getUserRepository()
    const user = await userRepository.findOne({ 
      where: { id: decoded.id }
    })
    
    if (user && user.is_active) {
      // 将用户信息添加到请求对象
      req.user = user
    }
    
    next()
  } catch (error) {
    // 忽略令牌错误，继续处理请求
    next()
  }
}

/**
 * 角色授权中间件
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('请先登录', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('权限不足', 403))
    }

    next()
  }
}

/**
 * 管理员权限中间件
 */
export const requireAdmin = authorize('admin')

/**
 * 邮箱验证中间件
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('请先登录', 401))
  }

  if (!req.user.is_email_verified) {
    return next(new AppError('请先验证邮箱', 401))
  }

  next()
}