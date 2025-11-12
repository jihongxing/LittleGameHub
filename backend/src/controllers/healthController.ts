import { Request, Response } from 'express'
import { AppDataSource } from '@/config/database.config'
import { env } from '@/config/env'

/**
 * 健康检查控制器
 * 用于检查各项服务的运行状态
 */

interface ServiceStatus {
  name: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  message?: string
  responseTime?: number
  details?: any
}

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  environment: string
  services: ServiceStatus[]
}

/**
 * 检查数据库连接状态
 */
async function checkDatabase(): Promise<ServiceStatus> {
  const startTime = Date.now()
  try {
    if (!AppDataSource.isInitialized) {
      return {
        name: 'Database (PostgreSQL)',
        status: 'unhealthy',
        message: 'Database connection not initialized'
      }
    }

    // 执行简单查询测试连接
    await AppDataSource.query('SELECT 1')
    const responseTime = Date.now() - startTime

    return {
      name: 'Database (PostgreSQL)',
      status: 'healthy',
      message: 'Connected',
      responseTime,
      details: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME
      }
    }
  } catch (error) {
    return {
      name: 'Database (PostgreSQL)',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Connection failed',
      responseTime: Date.now() - startTime
    }
  }
}

/**
 * 检查 Redis 连接状态
 */
async function checkRedis(): Promise<ServiceStatus> {
  const startTime = Date.now()
  try {
    // TODO: 实现 Redis 连接检查
    // 目前返回未知状态
    return {
      name: 'Redis',
      status: 'unknown',
      message: 'Redis check not implemented',
      responseTime: Date.now() - startTime
    }
  } catch (error) {
    return {
      name: 'Redis',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Connection failed',
      responseTime: Date.now() - startTime
    }
  }
}

/**
 * 检查环境变量配置
 */
function checkEnvironment(): ServiceStatus {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'JWT_SECRET'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    return {
      name: 'Environment Variables',
      status: 'unhealthy',
      message: `Missing required variables: ${missingVars.join(', ')}`
    }
  }

  return {
    name: 'Environment Variables',
    status: 'healthy',
    message: 'All required variables are set',
    details: {
      environment: env.NODE_ENV,
      port: env.PORT
    }
  }
}

/**
 * 检查磁盘空间
 */
function checkDiskSpace(): ServiceStatus {
  // 简化版本，实际生产环境可能需要使用 node-disk-info 等库
  return {
    name: 'Disk Space',
    status: 'unknown',
    message: 'Disk space check not implemented'
  }
}

/**
 * 获取系统信息
 */
function getSystemInfo() {
  return {
    platform: process.platform,
    nodeVersion: process.version,
    memory: {
      total: Math.round(require('os').totalmem() / 1024 / 1024) + ' MB',
      free: Math.round(require('os').freemem() / 1024 / 1024) + ' MB',
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
    },
    cpu: require('os').cpus()[0].model,
    cpuCount: require('os').cpus().length
  }
}

/**
 * 执行完整的健康检查
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  // 并行检查所有服务
  const [database, redis, environment, diskSpace] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    Promise.resolve(checkEnvironment()),
    Promise.resolve(checkDiskSpace())
  ])

  const services = [database, redis, environment, diskSpace]

  // 确定整体健康状态
  const hasUnhealthy = services.some(s => s.status === 'unhealthy')
  const hasUnknown = services.some(s => s.status === 'unknown')
  
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
  if (hasUnhealthy) {
    overallStatus = 'unhealthy'
  } else if (hasUnknown) {
    overallStatus = 'degraded'
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV || 'development',
    services
  }
}

/**
 * API 健康检查接口（JSON 格式）
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const result = await performHealthCheck()
    const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 207 : 503
    
    res.status(statusCode).json(result)
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed'
    })
  }
}

/**
 * 友好的 HTML 状态页面
 */
export const statusPage = async (req: Request, res: Response) => {
  try {
    const result = await performHealthCheck()
    const systemInfo = getSystemInfo()
    
    const statusColor = result.status === 'healthy' ? '#10b981' : result.status === 'degraded' ? '#f59e0b' : '#ef4444'
    const statusIcon = result.status === 'healthy' ? '✅' : result.status === 'degraded' ? '⚠️' : '❌'
    
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GameHub Backend Status</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header h1 {
      font-size: 32px;
      color: #667eea;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      color: white;
      background: ${statusColor};
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .info-item {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
    }
    .info-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }
    .services {
      display: grid;
      gap: 15px;
    }
    .service-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .service-info {
      flex: 1;
    }
    .service-name {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .service-message {
      font-size: 14px;
      color: #64748b;
    }
    .service-status {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .status-healthy { background: #10b981; }
    .status-unhealthy { background: #ef4444; }
    .status-unknown { background: #94a3b8; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .system-info {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .system-info h2 {
      font-size: 20px;
      margin-bottom: 15px;
      color: #1e293b;
    }
    .system-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }
    .details {
      font-size: 12px;
      color: #64748b;
      margin-top: 5px;
    }
    .response-time {
      font-size: 12px;
      color: #10b981;
      font-weight: 500;
    }
    .refresh-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      margin-top: 20px;
      transition: background 0.3s;
    }
    .refresh-btn:hover {
      background: #5568d3;
    }
    .footer {
      text-align: center;
      color: white;
      margin-top: 30px;
      font-size: 14px;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>
        <span>🎮</span>
        GameHub Backend
        <span class="status-badge">${statusIcon} ${result.status.toUpperCase()}</span>
      </h1>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Environment</div>
          <div class="info-value">${result.environment}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Version</div>
          <div class="info-value">${result.version}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Uptime</div>
          <div class="info-value">${Math.floor(result.uptime / 60)} minutes</div>
        </div>
        <div class="info-item">
          <div class="info-label">Last Check</div>
          <div class="info-value">${new Date(result.timestamp).toLocaleTimeString()}</div>
        </div>
      </div>
    </div>

    <div class="services">
      ${result.services.map(service => `
        <div class="service-card">
          <div class="service-info">
            <div class="service-name">${service.name}</div>
            <div class="service-message">${service.message || 'No additional information'}</div>
            ${service.details ? `<div class="details">${JSON.stringify(service.details)}</div>` : ''}
            ${service.responseTime ? `<div class="response-time">Response time: ${service.responseTime}ms</div>` : ''}
          </div>
          <div class="service-status">
            <div class="status-indicator status-${service.status}"></div>
            <span>${service.status.toUpperCase()}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="system-info">
      <h2>📊 System Information</h2>
      <div class="system-grid">
        <div class="info-item">
          <div class="info-label">Platform</div>
          <div class="info-value">${systemInfo.platform}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Node.js Version</div>
          <div class="info-value">${systemInfo.nodeVersion}</div>
        </div>
        <div class="info-item">
          <div class="info-label">CPU</div>
          <div class="info-value">${systemInfo.cpuCount} cores</div>
        </div>
        <div class="info-item">
          <div class="info-label">Memory Used</div>
          <div class="info-value">${systemInfo.memory.used}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Memory Total</div>
          <div class="info-value">${systemInfo.memory.total}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Memory Free</div>
          <div class="info-value">${systemInfo.memory.free}</div>
        </div>
      </div>
    </div>

    <button class="refresh-btn" onclick="location.reload()">🔄 Refresh Status</button>

    <div class="footer">
      <p>GameHub Backend Service | Last updated: ${new Date().toLocaleString()}</p>
      <p style="margin-top: 10px;">
        <a href="/api/health" style="color: white; text-decoration: underline;">JSON API</a> | 
        <a href="/api" style="color: white; text-decoration: underline;">API Documentation</a>
      </p>
    </div>
  </div>
</body>
</html>
    `
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (error) {
    res.status(503).send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>❌ Service Unavailable</h1>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        </body>
      </html>
    `)
  }
}

