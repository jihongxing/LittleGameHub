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

import { Controller, Get, Header } from '@nestjs/common';
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
  async getHello(): Promise<any> {
    return await this.appService.getHello();
  }

  /**
   * HTML 格式的欢迎页面
   * HTML format welcome page
   */
  @Get('welcome')
  @Header('Content-Type', 'text/html')
  async getWelcomeHtml(): Promise<string> {
    const data = await this.appService.getHello();
    const services = await this.appService.getHealth();
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .container { 
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 800px;
            width: 90%;
        }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 2.5em; margin-bottom: 10px; color: #667eea; }
        .subtitle { font-size: 1.2em; color: #666; margin-bottom: 20px; }
        .status { 
            display: inline-block;
            padding: 8px 16px;
            background: #4CAF50;
            color: white;
            border-radius: 20px;
            font-size: 0.9em;
        }
        .info-grid { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .info-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        .info-card h3 { color: #667eea; margin-bottom: 10px; }
        .services { margin-top: 30px; }
        .service-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            margin: 10px 0;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .service-status {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .connected { background: #d4edda; color: #155724; }
        .disconnected { background: #f8d7da; color: #721c24; }
        .loaded { background: #cce7ff; color: #004085; }
        .endpoints { margin-top: 20px; }
        .endpoint { 
            display: block;
            color: #667eea;
            text-decoration: none;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .endpoint:hover { background: #f0f0f0; padding-left: 10px; }
        .footer { text-align: center; margin-top: 30px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${data.title}</h1>
            <p class="subtitle">基于 ${data.framework} 的现代化游戏聚合平台 API</p>
            <span class="status">${data.message}</span>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>🚀 系统信息</h3>
                <p><strong>版本:</strong> ${data.version}</p>
                <p><strong>环境:</strong> ${data.environment}</p>
                <p><strong>运行时间:</strong> ${data.uptime}</p>
            </div>
            
            <div class="info-card">
                <h3>📊 服务状态</h3>
                <p><strong>总体状态:</strong> ${services.status}</p>
                <p><strong>检查时间:</strong> ${new Date(services.timestamp).toLocaleString('zh-CN')}</p>
            </div>
        </div>

        <div class="services">
            <h3>🔧 服务详情</h3>
            <div class="service-item">
                <span><strong>数据库 (PostgreSQL)</strong></span>
                <span class="service-status ${services.services.database.status === 'connected' ? 'connected' : 'disconnected'}">
                    ${services.services.database.status === 'connected' ? '✅ 已连接' : '❌ 未连接'}
                </span>
            </div>
            <div class="service-item">
                <span><strong>缓存 (Redis)</strong></span>
                <span class="service-status ${services.services.redis.status === 'connected' ? 'connected' : 'disconnected'}">
                    ${services.services.redis.status === 'connected' ? '✅ 已连接' : '❌ 未连接'}
                </span>
            </div>
            <div class="service-item">
                <span><strong>业务模块</strong></span>
                <span class="service-status loaded">✅ ${services.services.modules.count} 个模块已加载</span>
            </div>
        </div>

        <div class="endpoints">
            <h3>🔗 API 端点</h3>
            <a href="/api" class="endpoint">📋 API 信息 - /api</a>
            <a href="/api/health" class="endpoint">💚 健康检查 - /api/health</a>
            <a href="/api/welcome" class="endpoint">🏠 欢迎页面 - /api/welcome</a>
            <a href="#" class="endpoint">📚 API 文档 - /api/docs (即将推出)</a>
        </div>

        <div class="footer">
            <p>🎮 GameHub - 让游戏触手可及</p>
            <p>启动时间: ${new Date(data.startTime).toLocaleString('zh-CN')}</p>
        </div>
    </div>
</body>
</html>`;
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
  async getHealth(): Promise<{ status: string; timestamp: string; services: any }> {
    return await this.appService.getHealth();
  }
}
