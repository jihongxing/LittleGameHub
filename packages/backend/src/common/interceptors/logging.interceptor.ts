/**
 * Request Logging Interceptor
 * 请求日志记录拦截器
 * 
 * This interceptor provides comprehensive logging for all HTTP requests and responses
 * in the GameHub application. It captures request details, response times, and
 * sanitizes sensitive information for security purposes.
 * 
 * 此拦截器为 GameHub 应用程序中的所有 HTTP 请求和响应提供全面的日志记录。
 * 它捕获请求详情、响应时间，并为安全目的清理敏感信息。
 * 
 * Key features:
 * - Request and response logging with timing
 * - Sensitive data sanitization (passwords, tokens)
 * - IP address tracking
 * - Query parameters and request body logging
 * - Error response logging
 * - Development vs production logging levels
 * 
 * 主要功能：
 * - 带时间记录的请求和响应日志
 * - 敏感数据清理（密码、令牌）
 * - IP 地址跟踪
 * - 查询参数和请求体日志记录
 * - 错误响应日志记录
 * - 开发与生产环境日志级别
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 * @task T027
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const { method, url, body, query, params, ip } = request;

    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `➡️  ${method} ${url} - ${ip} ${JSON.stringify({ query, params }).substring(0, 100)}`
    );

    // Log request body (excluding sensitive fields)
    if (body && Object.keys(body).length > 0) {
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(`   Body: ${JSON.stringify(sanitizedBody).substring(0, 200)}`);
    }

    return next.handle().pipe(
      tap({
        next: data => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          
          // Log response
          this.logger.log(
            `⬅️  ${method} ${url} ${statusCode} - ${duration}ms`
          );

          // Log response data in debug mode
          if (process.env.NODE_ENV === 'development' && data) {
            this.logger.debug(`   Response: ${JSON.stringify(data).substring(0, 200)}`);
          }
        },
        error: error => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          
          // Log error response
          this.logger.error(
            `❌ ${method} ${url} ${statusCode} - ${duration}ms - ${error.message}`
          );
        },
      })
    );
  }

  /**
   * Remove sensitive fields from request body
   */
  private sanitizeBody(body: any): any {
    const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'api_key'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }
}
