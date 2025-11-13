/**
 * Simplified GameHub Backend Entry Point
 * 简化的 GameHub 后端入口点
 * 
 * This is a simplified version of the main entry file that focuses on
 * core NestJS functionality without complex dependencies.
 * 
 * 这是主入口文件的简化版本，专注于核心 NestJS 功能，
 * 不包含复杂的依赖项。
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.simple.module'

/**
 * Bootstrap function for simplified application
 * 简化应用程序的引导函数
 */
async function bootstrap() {
  // Create NestJS application instance
  // 创建 NestJS 应用程序实例
  const app = await NestFactory.create(AppModule)
  
  // Enable CORS for development
  // 为开发环境启用 CORS
  app.enableCors()
  
  // Set global API prefix
  // 设置全局 API 前缀
  app.setGlobalPrefix('api')
  
  // Start the server
  // 启动服务器
  const port = process.env.PORT || 3000
  await app.listen(port)
  
  console.log(`🚀 GameHub API Server is running on port ${port}`)
  console.log(`📍 API Endpoint: http://localhost:${port}/api`)
}

/**
 * Start the application
 * 启动应用程序
 */
bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error)
  process.exit(1)
})
