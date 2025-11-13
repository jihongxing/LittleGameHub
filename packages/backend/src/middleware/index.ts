// 导出所有中间件
export { authenticate, optionalAuthenticate, authorize, requireAdmin, requireEmailVerification } from './auth'
export { errorHandler, catchAsync, AppError } from './errorHandler'
export { notFoundHandler } from './notFoundHandler'
export { requestLogger } from './requestLogger'
import {
  generalLimiter,
  strictLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  downloadLimiter
} from './rateLimiter'

export {
  generalLimiter,
  strictLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  downloadLimiter
}

// 导出rateLimiter对象，包含所有限流器
export const rateLimiter = {
  generalLimiter,
  strictLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  downloadLimiter
}