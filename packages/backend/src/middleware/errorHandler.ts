import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { 
  ErrorType, 
  ErrorSeverity, 
  ERROR_STATUS_CODES, 
  ERROR_SEVERITY_MAP 
} from '@/types/errors';
import { QueryFailedError } from 'typeorm';

/**
 * 自定义应用错误类
 * Custom Application Error Class
 */
export class AppError extends Error {
  public statusCode: number;
  public errorType: ErrorType;
  public severity: ErrorSeverity;
  public isOperational: boolean;
  public details?: any;
  public timestamp: Date;
  public requestId?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorType: ErrorType = ErrorType.INTERNAL_ERROR,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.severity = ERROR_SEVERITY_MAP[errorType];
    this.isOperational = true;
    this.details = details;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 将错误转换为客户端安全的响应格式
   */
  toJSON() {
    return {
      status: 'error',
      message: this.message,
      errorType: this.errorType,
      ...(process.env.NODE_ENV === 'development' && {
        stack: this.stack,
        details: this.details,
      }),
    };
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ERROR_STATUS_CODES[ErrorType.VALIDATION_ERROR], ErrorType.VALIDATION_ERROR, details);
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '身份验证失败，请重新登录') {
    super(message, ERROR_STATUS_CODES[ErrorType.AUTHENTICATION_ERROR], ErrorType.AUTHENTICATION_ERROR);
  }
}

/**
 * 授权错误
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '您没有权限执行此操作') {
    super(message, ERROR_STATUS_CODES[ErrorType.AUTHORIZATION_ERROR], ErrorType.AUTHORIZATION_ERROR);
  }
}

/**
 * 资源未找到错误
 */
export class NotFoundError extends AppError {
  constructor(resource: string = '资源') {
    super(`${resource}不存在`, ERROR_STATUS_CODES[ErrorType.NOT_FOUND_ERROR], ErrorType.NOT_FOUND_ERROR);
  }
}

/**
 * 冲突错误
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ERROR_STATUS_CODES[ErrorType.CONFLICT_ERROR], ErrorType.CONFLICT_ERROR, details);
  }
}

/**
 * 频率限制错误
 */
export class RateLimitError extends AppError {
  constructor(message: string = '请求过于频繁，请稍后再试') {
    super(message, ERROR_STATUS_CODES[ErrorType.RATE_LIMIT_ERROR], ErrorType.RATE_LIMIT_ERROR);
  }
}

/**
 * 数据库错误
 */
export class DatabaseError extends AppError {
  constructor(message: string = '数据库操作失败', details?: any) {
    super(message, ERROR_STATUS_CODES[ErrorType.DATABASE_ERROR], ErrorType.DATABASE_ERROR, details);
    this.isOperational = false; // 数据库错误通常是编程错误
  }
}

/**
 * 处理 TypeORM QueryFailedError
 */
const handleTypeORMQueryFailedError = (err: QueryFailedError): AppError => {
  // TypeORM 错误消息通常包含敏感信息，需要过滤
  const message = err.message;

  // 唯一约束冲突
  if (message.includes('UNIQUE') || message.includes('duplicate key')) {
    // 尝试提取字段名
    const match = message.match(/Key \((.*?)\)/);
    const field = match ? match[1] : '字段';
    return new ConflictError(`${field}已存在，请使用其他值`, { originalError: message });
  }

  // 外键约束冲突
  if (message.includes('FOREIGN KEY') || message.includes('violates foreign key')) {
    return new ValidationError('关联数据不存在，请检查输入', { originalError: message });
  }

  // NOT NULL 约束
  if (message.includes('NOT NULL') || message.includes('null value')) {
    const match = message.match(/column "(.*?)"/);
    const field = match ? match[1] : '必填字段';
    return new ValidationError(`${field}不能为空`, { originalError: message });
  }

  // CHECK 约束
  if (message.includes('CHECK constraint')) {
    return new ValidationError('输入数据不符合约束条件', { originalError: message });
  }

  // 其他数据库错误
  return new DatabaseError('数据库操作失败', { originalError: message });
};

/**
 * 处理 JWT 错误
 */
const handleJWTError = (err: Error): AppError => {
  if (err.name === 'TokenExpiredError') {
    return new AuthenticationError('令牌已过期，请重新登录');
  }
  if (err.name === 'JsonWebTokenError') {
    return new AuthenticationError('无效的令牌，请重新登录');
  }
  return new AuthenticationError('身份验证失败');
};

/**
 * 处理 Multer 文件上传错误
 */
const handleMulterError = (err: any): AppError => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('文件太大，超出大小限制');
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new ValidationError('文件数量超出限制');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('意外的文件字段');
  }
  return new ValidationError('文件上传失败', { originalError: err.message });
};

/**
 * 发送错误响应（开发环境）
 */
const sendErrorDev = (err: AppError, req: Request, res: Response): void => {
  logger.error(`[${err.errorType}] ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
    stack: err.stack,
    severity: err.severity,
  });

  res.status(err.statusCode).json({
    status: 'error',
    errorType: err.errorType,
    severity: err.severity,
    message: err.message,
    details: err.details,
    stack: err.stack,
    timestamp: err.timestamp,
  });
};

/**
 * 发送错误响应（生产环境）
 */
const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
  // 记录详细错误日志
  logger.error(`[${err.errorType}] ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    severity: err.severity,
    stack: err.stack,
  });

  // 操作错误：发送消息给客户端
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      timestamp: err.timestamp,
    });
  } else {
    // 编程错误：不泄露错误详情
    logger.error('💥 CRITICAL ERROR', {
      error: err,
      stack: err.stack,
    });

    res.status(500).json({
      status: 'error',
      message: '服务器内部错误，请稍后再试',
      timestamp: new Date(),
    });
  }
};

/**
 * 全局错误处理中间件
 * Global Error Handling Middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 如果响应已经发送，交给默认错误处理器
  if (res.headersSent) {
    return next(err);
  }

  let error: AppError;

  // 如果已经是 AppError，直接使用
  if (err instanceof AppError) {
    error = err;
  }
  // TypeORM QueryFailedError
  else if (err instanceof QueryFailedError) {
    error = handleTypeORMQueryFailedError(err);
  }
  // JWT 错误
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }
  // Multer 文件上传错误
  else if (err.name === 'MulterError') {
    error = handleMulterError(err);
  }
  // 语法错误 (通常是 JSON 解析错误)
  else if (err instanceof SyntaxError && 'body' in err) {
    error = new ValidationError('请求格式错误，请检查 JSON 格式');
  }
  // 其他未知错误
  else {
    error = new AppError(
      err.message || '发生了未知错误',
      err.statusCode || 500,
      ErrorType.INTERNAL_ERROR
    );
    error.isOperational = false;
    error.stack = err.stack;
  }

  // 根据环境发送不同的错误响应
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

/**
 * 异步错误捕获包装器
 * Async Error Catching Wrapper
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 处理未捕获的拒绝
 * Handle Unhandled Rejections
 */
export const handleUnhandledRejection = (reason: Error, promise: Promise<any>) => {
  logger.error('💥 UNHANDLED REJECTION! Shutting down...', {
    reason: reason.message,
    stack: reason.stack,
  });
  // 在生产环境中，可能需要优雅地关闭服务器
  // process.exit(1);
};

/**
 * 处理未捕获的异常
 * Handle Uncaught Exceptions
 */
export const handleUncaughtException = (error: Error) => {
  logger.error('💥 UNCAUGHT EXCEPTION! Shutting down...', {
    error: error.message,
    stack: error.stack,
  });
  // 在生产环境中，应该优雅地关闭服务器
  process.exit(1);
};
