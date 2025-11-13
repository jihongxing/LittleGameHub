// 导出所有中间件
export { authenticate, optionalAuthenticate, authorize, requireAdmin, requireEmailVerification } from './auth'
export { 
  errorHandler, 
  catchAsync, 
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError
} from './errorHandler'
export { notFoundHandler } from './notFoundHandler'
export { requestLogger } from './requestLogger'
import {
  // 传统限流器
  generalLimiter,
  strictLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  downloadLimiter,
  // 增强限流器
  userBasedGeneralLimiter,
  userBasedStrictLimiter,
  userBasedLoginLimiter,
  userBasedRegisterLimiter,
  userBasedDownloadLimiter,
  // CSRF 保护
  csrfProtection,
  csrfTokenSetter,
  // 组合中间件
  secureAuthRoute,
  secureUserRoute,
  secureDownloadRoute,
} from './rateLimiter'

export {
  // 传统限流器（向后兼容）
  generalLimiter,
  strictLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  downloadLimiter,
  // 增强限流器
  userBasedGeneralLimiter,
  userBasedStrictLimiter,
  userBasedLoginLimiter,
  userBasedRegisterLimiter,
  userBasedDownloadLimiter,
  // CSRF 保护
  csrfProtection,
  csrfTokenSetter,
  // 组合中间件
  secureAuthRoute,
  secureUserRoute,
  secureDownloadRoute,
}

// 导出rateLimiter对象，包含所有限流器
export const rateLimiter = {
  // 传统限流器
  generalLimiter,
  strictLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  downloadLimiter,
  // 增强限流器
  userBasedGeneralLimiter,
  userBasedStrictLimiter,
  userBasedLoginLimiter,
  userBasedRegisterLimiter,
  userBasedDownloadLimiter,
}