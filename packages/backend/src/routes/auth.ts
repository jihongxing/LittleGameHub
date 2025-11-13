import { Router } from 'express'
import * as authController from '@/controllers/authController'
import * as validation from '@/utils/validation'
import { authenticate, rateLimiter } from '@/middleware'
import { validateBody } from '@/middleware/validation'
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from '@littlegamehub/shared'

const router = Router()

// 用户注册 - 使用新的 DTO 验证
router.post(
  '/register',
  rateLimiter.registerLimiter,
  validateBody(RegisterDto),
  authController.register
)

// 用户登录 - 使用新的 DTO 验证
router.post(
  '/login',
  rateLimiter.loginLimiter,
  validateBody(LoginDto),
  authController.login
)

// 刷新令牌
router.post(
  '/refresh',
  authController.refreshToken
)

// 验证邮箱
router.post(
  '/verify-email',
  rateLimiter.emailVerificationLimiter,
  validation.validateEmailVerification,
  authController.verifyEmail
)

// 重新发送验证邮件
router.post(
  '/resend-verification',
  rateLimiter.emailVerificationLimiter,
  validation.validateResendVerification,
  authController.resendVerificationEmail
)

// 请求密码重置
router.post(
  '/forgot-password',
  rateLimiter.passwordResetLimiter,
  validation.validateForgotPassword,
  authController.forgotPassword
)

// 重置密码
router.post(
  '/reset-password',
  rateLimiter.passwordResetLimiter,
  validation.validateResetPassword,
  authController.resetPassword
)

// 获取当前用户信息
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
)

// 更新当前用户信息 - 使用新的 DTO 验证
router.put(
  '/me',
  authenticate,
  validateBody(UpdateProfileDto),
  authController.updateCurrentUser
)

// 更改密码 - 使用新的 DTO 验证
router.put(
  '/change-password',
  authenticate,
  validateBody(ChangePasswordDto),
  authController.changePassword
)

export default router