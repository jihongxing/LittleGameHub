import { Request, Response, NextFunction } from 'express'
import { httpLogger } from '@/utils/logger'

/**
 * HTTP请求日志中间件
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now()
  
  // 记录请求开始
  httpLogger.http('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  })
  
  // 监听响应结束事件
  res.on('finish', () => {
    const duration = Date.now() - start
    
    // 记录请求完成
    httpLogger.http('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    })
  })
  
  next()
}