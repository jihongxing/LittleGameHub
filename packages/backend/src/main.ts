/**
 * GameHub Backend Application Entry Point
 * GameHub 后端应用程序入口点
 * 
 * This is the main entry file for the GameHub backend application.
 * It initializes the NestJS application with all necessary configurations,
 * middleware, interceptors, and database connections.
 * 
 * 这是 GameHub 后端应用程序的主入口文件。
 * 它初始化 NestJS 应用程序，包含所有必要的配置、
 * 中间件、拦截器和数据库连接。
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import 'reflect-metadata'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from root directory FIRST
// 首先从根目录加载环境变量
const envPath = path.resolve(__dirname, '../../../.env')
console.log(`📁 Loading .env from: ${envPath}`)
const dotenvResult = dotenv.config({ path: envPath })
if (dotenvResult.error) {
  console.error(`❌ Failed to load .env file: ${dotenvResult.error.message}`)
} else {
  console.log(`✅ .env file loaded successfully`)
  console.log(`   DB_PASSWORD in process.env: ${process.env.DB_PASSWORD ? '***' : '(not set)'}`)
}

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { env } from './config/env'
import { createValidationPipe } from './common/pipes/validation.pipe'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { ErrorHandlerInterceptor } from './common/interceptors/error-handler.interceptor'
import { connectDatabase } from './config/database'
import { connectRedis } from './config/redis'

/**
 * Bootstrap function to initialize and start the NestJS application
 * 引导函数，用于初始化和启动 NestJS 应用程序
 * 
 * This function performs the following operations:
 * 1. Creates a NestJS application instance
 * 2. Configures global validation pipes
 * 3. Sets up global interceptors for logging and error handling
 * 4. Enables CORS for cross-origin requests
 * 5. Sets API prefix for all routes
 * 6. Establishes database and Redis connections
 * 7. Starts the server on the configured port
 * 
 * 此函数执行以下操作：
 * 1. 创建 NestJS 应用程序实例
 * 2. 配置全局验证管道
 * 3. 设置用于日志记录和错误处理的全局拦截器
 * 4. 启用 CORS 以支持跨域请求
 * 5. 为所有路由设置 API 前缀
 * 6. 建立数据库和 Redis 连接
 * 7. 在配置的端口上启动服务器
 */
async function bootstrap() {
  try {
    console.log('🚀 Starting NestJS application...')
    const app = await NestFactory.create(AppModule)
    console.log('✅ NestJS application created successfully')
  
    // Configure global validation pipe for request validation
    // 配置全局验证管道用于请求验证
    app.useGlobalPipes(createValidationPipe())
  
    // Set up global interceptors for logging and error handling
    // 设置全局拦截器用于日志记录和错误处理
    app.useGlobalInterceptors(new LoggingInterceptor(), new ErrorHandlerInterceptor())
  
    // Enable CORS with configured origin and credentials
    // 启用 CORS，配置允许的源和凭据
    const corsOrigins = env.CORS_ORIGIN.split(',').map(origin => origin.trim());
    app.enableCors({ 
      origin: corsOrigins, 
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    })
  
    // Set global API prefix for all routes
    // 为所有路由设置全局 API 前缀
    app.setGlobalPrefix(env.API_PREFIX)
  
    // Initialize database connection
    // 初始化数据库连接
    await connectDatabase()
  
    // Initialize Redis connection
    // 初始化 Redis 连接
    await connectRedis()
  
    // Start the server on the configured port
    // 在配置的端口上启动服务器
    await app.listen(env.PORT)
  
    console.log(`🚀 GameHub API Server is running on port ${env.PORT}`)
    console.log(`🌍 Environment: ${env.NODE_ENV}`)
    console.log(`📍 API Endpoint: http://localhost:${env.PORT}${env.API_PREFIX}`)
  } catch (error) {
    console.error('❌ Error during bootstrap:', error)
    throw error
  }
}

/**
 * Start the application and handle any startup errors
 * 启动应用程序并处理任何启动错误
 * 
 * If the bootstrap process fails, the error will be logged
 * and the process will exit with code 1.
 * 
 * 如果引导过程失败，将记录错误并以代码 1 退出进程。
 */
bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to start NestJS application:', error)
  console.error('应用程序启动失败:', error)
  process.exit(1)
})

