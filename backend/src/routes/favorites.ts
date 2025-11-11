import { Router } from 'express'
import * as favoriteController from '@/controllers/favoriteController'
import * as validation from '@/utils/validation'
import { authenticate, authorize, requireAdmin, rateLimiter } from '@/middleware'

const router = Router()

// 获取收藏列表（管理员）
router.get(
  '/',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  favoriteController.getFavorites
)

// 获取收藏详情（管理员）
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  favoriteController.getFavoriteById
)

// 添加收藏
router.post(
  '/',
  authenticate,
  rateLimiter.generalLimiter,
  validation.validateAddFavorite,
  favoriteController.addFavorite
)

// 取消收藏
router.delete(
  '/',
  authenticate,
  rateLimiter.generalLimiter,
  validation.validateRemoveFavorite,
  favoriteController.removeFavorite
)

// 删除收藏记录（管理员）
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  rateLimiter.strictLimiter,
  favoriteController.deleteFavorite
)

// 检查是否已收藏
router.get(
  '/check/status',
  authenticate,
  rateLimiter.generalLimiter,
  favoriteController.checkFavorite
)

// 获取用户收藏的游戏列表（管理员）
router.get(
  '/user/:userId/games',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  favoriteController.getUserFavoriteGames
)

// 获取游戏收藏用户列表（管理员）
router.get(
  '/game/:gameId/users',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  favoriteController.getGameFavoriteUsers
)

// 获取收藏统计信息（管理员）
router.get(
  '/stats/data',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  favoriteController.getFavoriteStats
)

export default router