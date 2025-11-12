/**
 * Global Error Handling Interceptor
 * 全局错误处理拦截器
 * 
 * This interceptor provides centralized error handling for the entire GameHub
 * application. It catches all unhandled errors, formats them consistently,
 * and provides appropriate HTTP responses with proper status codes.
 * 
 * 此拦截器为整个 GameHub 应用程序提供集中的错误处理。
 * 它捕获所有未处理的错误，统一格式化，并提供带有适当状态码的 HTTP 响应。
 * 
 * Key features:
 * - Centralized error handling across all endpoints
 * - Consistent error response format
 * - Database error mapping
 * - JWT error handling
 * - Development vs production error details
 * - Request context logging
 * 
 * 主要功能：
 * - 跨所有端点的集中错误处理
 * - 一致的错误响应格式
 * - 数据库错误映射
 * - JWT 错误处理
 * - 开发与生产环境错误详情
 * - 请求上下文日志记录
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 * @task T026
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  details?: any;
}

@Injectable()
export class ErrorHandlerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorHandlerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(err => {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        // Log the error
        this.logger.error(
          `Error in ${request.method} ${request.url}: ${err.message}`,
          err.stack
        );

        // Determine status code and error response
        const errorResponse = this.formatError(err, request);

        // Set status code and send response
        response.status(errorResponse.statusCode).json(errorResponse);

        return throwError(() => err);
      })
    );
  }

  private formatError(err: any, request: any): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;

    // Handle HttpException
    if (err instanceof HttpException) {
      const status = err.getStatus();
      const response = err.getResponse();

      return {
        statusCode: status,
        message: typeof response === 'string' ? response : (response as any).message,
        error: err.name,
        timestamp,
        path,
        details: typeof response === 'object' ? response : undefined,
      };
    }

    // Handle database errors
    if (err.code) {
      return this.handleDatabaseError(err, timestamp, path);
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'ValidationError',
        timestamp,
        path,
        details: err.errors,
      };
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: err.message,
        error: 'AuthenticationError',
        timestamp,
        path,
      };
    }

    // Default internal server error
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'InternalServerError',
      timestamp,
      path,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    };
  }

  private handleDatabaseError(err: any, timestamp: string, path: string): ErrorResponse {
    // PostgreSQL error codes
    const errorCodeMap: Record<string, { status: HttpStatus; message: string }> = {
      '23505': { status: HttpStatus.CONFLICT, message: 'Duplicate entry' },
      '23503': { status: HttpStatus.BAD_REQUEST, message: 'Foreign key violation' },
      '23502': { status: HttpStatus.BAD_REQUEST, message: 'Not null violation' },
      '22001': { status: HttpStatus.BAD_REQUEST, message: 'String data too long' },
      '22P02': { status: HttpStatus.BAD_REQUEST, message: 'Invalid text representation' },
    };

    const errorInfo = errorCodeMap[err.code] || {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database error',
    };

    return {
      statusCode: errorInfo.status,
      message: errorInfo.message,
      error: 'DatabaseError',
      timestamp,
      path,
      details: process.env.NODE_ENV === 'development' ? err.detail : undefined,
    };
  }
}
