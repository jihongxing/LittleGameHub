import { Router } from 'express'
import * as gameController from '@/controllers/gameController'
import * as validation from '@/utils/validation'
import { authenticate, authorize, requireAdmin, rateLimiter } from '@/middleware'
import { uploadGameCover, uploadGameScreenshots } from '@/utils/fileUpload'
import { validateBody, validateQuery } from '@/middleware/validation'
import {
  QueryGamesDto,
  CreateGameDto,
  UpdateGameDto,
} from '@littlegamehub/shared'

const router = Router()

// 获取游戏列表（公开）- 使用新的 DTO 验证
router.get(
  '/',
  rateLimiter.generalLimiter,
  validateQuery(QueryGamesDto),
  gameController.getGames
)

// 获取游戏详情（公开）
router.get(
  '/:id',
  rateLimiter.generalLimiter,
  gameController.getGameById
)

// 创建游戏（管理员）- 使用新的 DTO 验证
router.post(
  '/',
  authenticate,
  requireAdmin,
  rateLimiter.strictLimiter,
  validateBody(CreateGameDto),
  gameController.createGame
)

// 更新游戏（管理员）- 使用新的 DTO 验证
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  rateLimiter.strictLimiter,
  validateBody(UpdateGameDto),
  gameController.updateGame
)

// 删除游戏（管理员）
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  rateLimiter.strictLimiter,
  gameController.deleteGame
)

// 获取精选游戏（公开）
router.get(
  '/featured/list',
  rateLimiter.generalLimiter,
  gameController.getFeaturedGames
)

// 获取免费游戏（公开）
router.get(
  '/free/list',
  rateLimiter.generalLimiter,
  gameController.getFreeGames
)

// 获取热门游戏（公开）
router.get(
  '/popular/list',
  rateLimiter.generalLimiter,
  gameController.getPopularGames
)

// 获取最新游戏（公开）
router.get(
  '/latest/list',
  rateLimiter.generalLimiter,
  gameController.getLatestGames
)

// 搜索游戏（公开）
router.get(
  '/search/query',
  rateLimiter.generalLimiter,
  gameController.searchGames
)

// 获取游戏统计信息（管理员）
router.get(
  '/stats/data',
  authenticate,
  requireAdmin,
  rateLimiter.generalLimiter,
  gameController.getGameStats
)

// 上传游戏封面（管理员）
router.post(
  '/:id/cover',
  authenticate,
  requireAdmin,
  rateLimiter.strictLimiter,
  uploadGameCover.single('cover'),
  gameController.uploadGameCover
)

// 上传游戏截图（管理员）
router.post(
  '/:id/screenshots',
  authenticate,
  requireAdmin,
  rateLimiter.strictLimiter,
  uploadGameScreenshots.array('screenshots', 10),
  gameController.uploadGameScreenshots
)

export default router