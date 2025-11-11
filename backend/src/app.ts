import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { sequelize } from '@/models'
import { errorHandler, notFoundHandler } from '@/middleware'
import routes from '@/routes'
import { logger } from '@/utils'

// 加载环境变量
dotenv.config()

// 创建Express应用
const app = express()

// 信任代理
app.set('trust proxy', 1)

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// CORS配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 压缩响应
app.use(compression())

// 解析Cookie
app.use(cookieParser())

// 解析JSON和URL编码的请求体
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 日志中间件
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }))
}

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API路由
app.use('/api', routes)

// 404处理
app.use(notFoundHandler)

// 错误处理中间件
app.use(errorHandler)

// 获取端口
const PORT = process.env.PORT || 5000

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate()
    logger.info('数据库连接成功')

    // 同步数据库模型
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true })
      logger.info('数据库模型同步完成')
    }

    // 启动服务器
    const server = app.listen(PORT, () => {
      logger.info(`服务器运行在端口 ${PORT}`)
      logger.info(`环境: ${process.env.NODE_ENV || 'development'}`)
    })

    // 优雅关闭
    const gracefulShutdown = async (signal: string) => {
      logger.info(`收到 ${signal} 信号，开始优雅关闭...`)
      
      server.close(async () => {
        logger.info('HTTP服务器已关闭')
        
        try {
          await sequelize.close()
          logger.info('数据库连接已关闭')
          process.exit(0)
        } catch (error) {
          logger.error('关闭数据库连接时出错:', error)
          process.exit(1)
        }
      })
    }

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    return server
  } catch (error) {
    logger.error('启动服务器失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  startServer()
}

export { app, startServer }