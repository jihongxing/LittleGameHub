/**
 * GameHub Application Root Controller
 * GameHub 应用程序根控制器
 * 
 * This controller handles root-level HTTP requests for the GameHub API.
 * It provides basic endpoints for application health checks and information.
 * 
 * 此控制器处理 GameHub API 的根级 HTTP 请求。
 * 它提供应用程序健康检查和信息的基本端点。
 * 
 * Available endpoints:
 * - GET / : Application welcome message
 * - GET /health : Health check endpoint
 * 
 * 可用端点：
 * - GET / : 应用程序欢迎消息
 * - GET /health : 健康检查端点
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Root Controller Class
 * 根控制器类
 * 
 * Uses dependency injection to access AppService for business logic.
 * All routes in this controller are prefixed with the global API prefix.
 * 
 * 使用依赖注入访问 AppService 以获取业务逻辑。
 * 此控制器中的所有路由都以全局 API 前缀为前缀。
 */
@Controller()
export class AppController {
  /**
   * Constructor with dependency injection
   * 带有依赖注入的构造函数
   * 
   * @param appService - Application service for business logic
   *                   - 用于业务逻辑的应用程序服务
   */
  constructor(private readonly appService: AppService) {}

  /**
   * Root endpoint - Application welcome message
   * 根端点 - 应用程序欢迎消息
   * 
   * Returns a welcome message indicating the API is running.
   * This endpoint can be used to verify the API is accessible.
   * 
   * 返回表示 API 正在运行的欢迎消息。
   * 此端点可用于验证 API 是否可访问。
   * 
   * @returns {string} Welcome message
   *                   欢迎消息
   * 
   * @example
   * GET /api/
   * Response: "GameHub API - NestJS Application"
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Health check endpoint
   * 健康检查端点
   * 
   * Provides application health status and timestamp.
   * Used by monitoring systems and load balancers to check service health.
   * 
   * 提供应用程序健康状态和时间戳。
   * 由监控系统和负载均衡器用于检查服务健康状况。
   * 
   * @returns {object} Health status object with status and timestamp
   *                   包含状态和时间戳的健康状态对象
   * 
   * @example
   * GET /api/health
   * Response: {
   *   "status": "ok",
   *   "timestamp": "2024-01-01T00:00:00.000Z"
   * }
   */
  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }
}
