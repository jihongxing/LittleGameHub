import { Router } from 'express'
import authRoutes from './auth'
import gameRoutes from './games'
import userRoutes from './users'
import downloadRoutes from './downloads'
import favoriteRoutes from './favorites'
import { requestLogger } from '@/middleware'

const router = Router()

// 应用请求日志中间件
router.use(requestLogger)

// API路由
router.use('/auth', authRoutes)
router.use('/games', gameRoutes)
router.use('/users', userRoutes)
router.use('/downloads', downloadRoutes)
router.use('/favorites', favoriteRoutes)

// API健康检查
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  })
})

export default router