import { Router } from 'express'
import * as userController from '@/controllers/userController'
import * as validation from '@/utils/validation'
import { authenticate, authorize, requireAdmin, rateLimiter } from '@/middleware'
import { uploadUserAvatar } from '@/utils/fileUpload'

const router = Router()

// 获取用户列表（管理员）
router.get(
  '/',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  userController.getUsers
)

// 获取用户详情（管理员）
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  userController.getUserById
)

// 更新用户信息（管理员）
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  rateLimiter.strictLimiter,
  validation.validateUpdateUserByAdmin,
  userController.updateUser
)

// 删除用户（管理员）
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  rateLimiter.strictLimiter,
  userController.deleteUser
)

// 禁用/启用用户（管理员）
router.patch(
  '/:id/toggle-status',
  authenticate,
  requireAdmin,
  rateLimiter.strictLimiter,
  userController.toggleUserStatus
)

// 获取用户收藏的游戏（管理员）
router.get(
  '/:id/favorites',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  userController.getUserFavorites
)

// 获取用户下载记录（管理员）
router.get(
  '/:id/downloads',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  userController.getUserDownloads
)

// 获取用户统计信息（管理员）
router.get(
  '/:id/stats',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  userController.getUserStats
)

// 上传用户头像（管理员）
router.post(
  '/:id/avatar',
  authenticate,
  requireAdmin,
  rateLimiter.strictLimiter,
  uploadUserAvatar.single('avatar'),
  userController.uploadUserAvatar
)

export default router