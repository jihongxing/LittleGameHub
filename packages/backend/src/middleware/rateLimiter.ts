import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AppError } from './errorHandler';
import { rateLimitService, RateLimitKeyType } from '@/services/security';

/**
 * ==================== 传统限流中间件（向后兼容） ====================
 */

/**
 * 通用限流中间件
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP在窗口期内最多100个请求
  standardHeaders: true, // 返回速率限制信息在 `RateLimit-*` headers
  legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
  message: {
    status: 'error',
    message: '请求过于频繁，请稍后再试'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 'error',
      message: '请求过于频繁，请稍后再试'
    })
  }
})

/**
 * 严格限流中间件（用于敏感操作）
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP在窗口期内最多5个请求
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: '操作过于频繁，请稍后再试'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 'error',
      message: '操作过于频繁，请稍后再试'
    })
  }
})

/**
 * 登录限流中间件
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 限制每个IP在窗口期内最多10次登录尝试
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功的请求不计入限制
  message: {
    status: 'error',
    message: '登录尝试过于频繁，请15分钟后再试'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 'error',
      message: '登录尝试过于频繁，请15分钟后再试'
    })
  }
})

/**
 * 注册限流中间件
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 限制每个IP在窗口期内最多5次注册尝试
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: '注册尝试过于频繁，请1小时后再试'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 'error',
      message: '注册尝试过于频繁，请1小时后再试'
    })
  }
})

/**
 * 密码重置限流中间件
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 限制每个IP在窗口期内最多3次密码重置请求
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: '密码重置请求过于频繁，请1小时后再试'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 'error',
      message: '密码重置请求过于频繁，请1小时后再试'
    })
  }
})

/**
 * 邮箱验证限流中间件
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10分钟
  max: 3, // 限制每个IP在窗口期内最多3次邮箱验证请求
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: '验证码请求过于频繁，请10分钟后再试'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 'error',
      message: '验证码请求过于频繁，请10分钟后再试'
    })
  }
})

/**
 * 游戏下载限流中间件
 */
export const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 限制每个用户在窗口期内最多10次游戏下载
  keyGenerator: (req: Request) => {
    // 如果用户已认证，使用用户ID；否则使用IP
    return req.user ? req.user.id : (req.ip || 'unknown')
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: '下载请求过于频繁，请1小时后再试'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 'error',
      message: '下载请求过于频繁，请1小时后再试'
    })
  }
})

/**
 * ==================== 增强限流中间件（新实现） ====================
 */

/**
 * 创建基于用户的通用限流中间件
 */
export const userBasedGeneralLimiter = rateLimitService.createMiddleware(
  'general',
  RateLimitKeyType.USER_IP
);

/**
 * 创建基于用户的严格限流中间件
 */
export const userBasedStrictLimiter = rateLimitService.createMiddleware(
  'auth-strict',
  RateLimitKeyType.USER_IP
);

/**
 * 创建基于用户的登录限流中间件
 */
export const userBasedLoginLimiter = rateLimitService.createMiddleware(
  'login',
  RateLimitKeyType.IP // 登录使用IP限流，避免账户锁定攻击
);

/**
 * 创建基于用户的注册限流中间件
 */
export const userBasedRegisterLimiter = rateLimitService.createMiddleware(
  'register',
  RateLimitKeyType.IP // 注册使用IP限流
);

/**
 * 创建基于用户的下载限流中间件
 */
export const userBasedDownloadLimiter = rateLimitService.createMiddleware(
  'download',
  RateLimitKeyType.USER // 下载基于用户限流
);

/**
 * ==================== CSRF 保护中间件 ====================
 */
import { csrfService } from '@/services/security';

/**
 * CSRF 保护中间件（用于状态改变操作）
 */
export const csrfProtection = csrfService.createMiddleware({
  skipAuth: false, // 需要用户认证
});

/**
 * CSRF Token 设置中间件（用于响应中设置Token）
 */
export const csrfTokenSetter = csrfService.createTokenMiddleware({
  alwaysSet: false, // 只在认证用户时设置
});

/**
 * ==================== 组合中间件 ====================
 */

/**
 * 安全的认证路由中间件组合
 * 包含 CSRF 保护和增强限流
 */
export const secureAuthRoute = [
  userBasedStrictLimiter,
  csrfProtection,
];

/**
 * 安全的用户操作中间件组合
 * 包含增强限流和 CSRF 保护
 */
export const secureUserRoute = [
  userBasedGeneralLimiter,
  csrfProtection,
];

/**
 * 安全的文件下载中间件组合
 * 包含用户限流
 */
export const secureDownloadRoute = [
  userBasedDownloadLimiter,
];