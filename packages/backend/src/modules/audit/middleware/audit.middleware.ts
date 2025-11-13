/**
 * 审计中间件
 * Audit Middleware
 *
 * 自动记录API请求和响应，用于审计和安全监控
 * Automatically logs API requests and responses for auditing and security monitoring
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/audit-log.service';
import { AuditEventType, AuditSeverity, AuditStatus } from '../entities/audit-log.entity';
import { logger } from '@/utils/logger';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private auditLogService: AuditLogService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // 保存原始的响应结束方法
    const originalEnd = res.end;
    const originalJson = res.json;
    const originalSend = res.send;

    // 记录请求信息
    const requestInfo = {
      method: req.method,
      path: req.path,
      ip: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      username: (req as any).user?.nickname,
    };

    let responseStatus: number = 200;
    let responseBody: any = null;

    // 拦截响应结束
    res.end = function(chunk?: any, encoding?: BufferEncoding | (() => void)): Response {
      const executionTime = Date.now() - startTime;
      responseStatus = res.statusCode;

      // 异步记录审计日志（不阻塞响应）
      setImmediate(() => {
        this.recordAuditLog(requestInfo, responseStatus, executionTime, req, res);
      });

      // 调用原始方法
      return originalEnd.call(this, chunk, encoding);
    }.bind(this);

    // 拦截JSON响应
    res.json = function(body?: any): Response {
      responseBody = body;
      return originalJson.call(this, body);
    }.bind(this);

    // 拦截发送响应
    res.send = function(body?: any): Response {
      if (typeof body === 'object' && body !== null) {
        responseBody = body;
      }
      return originalSend.call(this, body);
    }.bind(this);

    next();
  }

  /**
   * 记录审计日志
   * Record audit log
   */
  private async recordAuditLog(
    requestInfo: any,
    responseStatus: number,
    executionTime: number,
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // 跳过不重要的请求
      if (this.shouldSkipAudit(req)) {
        return;
      }

      const eventType = this.determineEventType(req);
      const severity = this.determineSeverity(req, responseStatus);
      const status = responseStatus >= 400 ? AuditStatus.FAILURE : AuditStatus.SUCCESS;

      // 构建描述
      const description = this.buildDescription(req, responseStatus);

      // 收集元数据
      const metadata = this.collectMetadata(req, res);

      await this.auditLogService.logEvent(eventType, description, {
        userId: requestInfo.userId,
        username: requestInfo.username,
        severity,
        status,
        ipAddress: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        requestMethod: requestInfo.method,
        requestPath: requestInfo.path,
        responseStatus,
        executionTime,
        metadata,
        sessionId: (req as any).session?.id,
      });

    } catch (error) {
      logger.error('Failed to record audit log in middleware:', error as Error);
      // 中间件错误不应该影响主要业务流程
    }
  }

  /**
   * 判断是否应该跳过审计
   * Determine if audit should be skipped
   */
  private shouldSkipAudit(req: Request): boolean {
    const skipPaths = [
      '/health',
      '/status',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ];

    // 跳过静态文件请求
    if (req.path.startsWith('/static/') || req.path.startsWith('/uploads/')) {
      return true;
    }

    // 跳过指定的路径
    if (skipPaths.includes(req.path)) {
      return true;
    }

    // 跳过 OPTIONS 请求
    if (req.method === 'OPTIONS') {
      return true;
    }

    // 跳过 HEAD 请求（通常用于健康检查）
    if (req.method === 'HEAD') {
      return true;
    }

    return false;
  }

  /**
   * 确定事件类型
   * Determine event type
   */
  private determineEventType(req: Request): AuditEventType {
    const path = req.path.toLowerCase();
    const method = req.method;

    // 认证相关
    if (path.includes('/auth/login')) {
      return AuditEventType.USER_LOGIN;
    }
    if (path.includes('/auth/logout')) {
      return AuditEventType.USER_LOGOUT;
    }
    if (path.includes('/auth/register')) {
      return AuditEventType.USER_REGISTER;
    }
    if (path.includes('/auth/change-password')) {
      return AuditEventType.USER_CHANGE_PASSWORD;
    }

    // 用户相关
    if (path.includes('/users/') && method === 'PUT') {
      return AuditEventType.USER_UPDATE_PROFILE;
    }

    // 游戏相关
    if (path.includes('/games/') && path.includes('/play')) {
      return AuditEventType.GAME_PLAY;
    }
    if (path.includes('/games/') && path.includes('/download')) {
      return AuditEventType.GAME_DOWNLOAD;
    }
    if (path.includes('/games/') && path.includes('/rate')) {
      return AuditEventType.GAME_RATE;
    }

    // 积分相关
    if (path.includes('/points/') && path.includes('/transfer')) {
      return AuditEventType.POINTS_TRANSFER;
    }

    // 管理员操作
    if (path.includes('/admin/')) {
      if (path.includes('/users/')) {
        return AuditEventType.ADMIN_USER_MANAGEMENT;
      }
      if (path.includes('/games/')) {
        return AuditEventType.ADMIN_GAME_MANAGEMENT;
      }
      if (path.includes('/system/')) {
        return AuditEventType.ADMIN_SYSTEM_CONFIG;
      }
      return AuditEventType.ADMIN_SECURITY_SETTINGS;
    }

    // 安全相关
    if (path.includes('/auth/') && method === 'POST') {
      return AuditEventType.SECURITY_FAILED_LOGIN;
    }

    // 默认事件类型
    return AuditEventType.USER_UPDATE_PROFILE;
  }

  /**
   * 确定严重程度
   * Determine severity
   */
  private determineSeverity(req: Request, responseStatus: number): AuditSeverity {
    // 错误响应
    if (responseStatus >= 500) {
      return AuditSeverity.CRITICAL;
    }
    if (responseStatus >= 400) {
      return AuditSeverity.HIGH;
    }

    // 管理员操作
    if (req.path.includes('/admin/')) {
      return AuditSeverity.HIGH;
    }

    // 敏感操作
    if (req.path.includes('/auth/change-password') ||
        req.path.includes('/auth/reset-password')) {
      return AuditSeverity.MEDIUM;
    }

    // 积分转账
    if (req.path.includes('/points/transfer')) {
      return AuditSeverity.MEDIUM;
    }

    return AuditSeverity.LOW;
  }

  /**
   * 构建描述
   * Build description
   */
  private buildDescription(req: Request, responseStatus: number): string {
    const method = req.method;
    const path = req.path;
    const userId = (req as any).user?.id;
    const status = responseStatus >= 400 ? '失败' : '成功';

    let description = `${method} ${path}`;

    if (userId) {
      description += ` (用户: ${userId})`;
    }

    description += ` - ${status}`;

    if (responseStatus >= 400) {
      description += ` (${responseStatus})`;
    }

    return description;
  }

  /**
   * 收集元数据
   * Collect metadata
   */
  private collectMetadata(req: Request, res: Response): any {
    const metadata: any = {};

    // 请求头信息（选择性收集，避免敏感信息）
    metadata.accept = req.get('Accept');
    metadata.contentType = req.get('Content-Type');

    // 查询参数（脱敏处理）
    if (Object.keys(req.query).length > 0) {
      metadata.query = this.sanitizeObject(req.query);
    }

    // 请求体（只收集基本信息，避免敏感数据）
    if (req.body && typeof req.body === 'object') {
      metadata.hasBody = true;
      metadata.bodyKeys = Object.keys(req.body);
    }

    // 响应头信息
    metadata.responseContentType = res.get('Content-Type');
    metadata.responseLength = res.get('Content-Length');

    return metadata;
  }

  /**
   * 获取客户端IP
   * Get client IP
   */
  private getClientIP(req: Request): string {
    // 检查代理头
    const forwarded = req.get('X-Forwarded-For');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = req.get('X-Real-IP');
    if (realIP) {
      return realIP;
    }

    // 检查连接信息
    const connectionRemoteAddress = (req as any).connection?.remoteAddress;
    if (connectionRemoteAddress) {
      return connectionRemoteAddress;
    }

    const socketRemoteAddress = (req as any).socket?.remoteAddress;
    if (socketRemoteAddress) {
      return socketRemoteAddress;
    }

    return req.ip || 'unknown';
  }

  /**
   * 脱敏对象
   * Sanitize object
   */
  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = { ...obj };

    // 脱敏敏感字段
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

/**
 * 创建审计中间件的工厂函数
 * Factory function to create audit middleware
 */
export function createAuditMiddleware(auditLogService: AuditLogService) {
  return new AuditMiddleware(auditLogService);
}
