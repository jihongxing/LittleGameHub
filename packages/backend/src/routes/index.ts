import { Router } from 'express'
import authRoutes from './auth'
import gameRoutes from './games'
import userRoutes from './users'
import downloadRoutes from './downloads'
import favoriteRoutes from './favorites'
import { requestLogger } from '@/middleware'
import { getRecommendations } from '@/controllers/gameController'
import { healthCheck } from '@/controllers/healthController'

const router = Router()

// 应用请求日志中间件
router.use(requestLogger)

// API路由
router.use('/auth', authRoutes)
router.use('/games', gameRoutes)
router.use('/users', userRoutes)
router.use('/downloads', downloadRoutes)
router.use('/favorites', favoriteRoutes)

// 推荐接口（临时：返回热门游戏）
router.get('/recommendations', getRecommendations)

// API健康检查（JSON格式）
router.get('/health', healthCheck)

export default router