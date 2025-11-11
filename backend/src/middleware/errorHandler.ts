import { Request, Response, NextFunction } from 'express'
import { logger } from '@/utils/logger'

/**
 * 自定义错误类
 */
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 处理Sequelize验证错误
 */
const handleSequelizeValidationError = (err: any): AppError => {
  const errors = err.errors.map((error: any) => error.message)
  const message = `输入数据无效: ${errors.join('. ')}`
  return new AppError(message, 400)
}

/**
 * 处理Sequelize唯一约束错误
 */
const handleSequelizeUniqueConstraintError = (err: any): AppError => {
  const field = err.errors[0].path
  const message = `${field}已存在，请使用其他值`
  return new AppError(message, 400)
}

/**
 * 处理Sequelize外键约束错误
 */
const handleSequelizeForeignKeyConstraintError = (err: any): AppError => {
  return new AppError('关联数据不存在，请检查输入', 400)
}

/**
 * 处理JWT错误
 */
const handleJWTError = (): AppError => {
  return new AppError('无效的令牌，请重新登录', 401)
}

/**
 * 处理JWT过期错误
 */
const handleJWTExpiredError = (): AppError => {
  return new AppError('令牌已过期，请重新登录', 401)
}

/**
 * 发送错误响应（开发环境）
 */
const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode).json({
    status: 'error',
    error: err,
    message: err.message,
    stack: err.stack
  })
}

/**
 * 发送错误响应（生产环境）
 */
const sendErrorProd = (err: AppError, res: Response): void => {
  // 操作错误：发送消息给客户端
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    })
  } else {
    // 编程错误：不泄露错误详情
    logger.error('ERROR 💥', err)
    
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误'
    })
  }
}

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err }
  error.message = err.message

  // 记录错误日志
  logger.error(`${err.name}: ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Sequelize验证错误
  if (err.name === 'SequelizeValidationError') {
    error = handleSequelizeValidationError(err)
  }
  
  // Sequelize唯一约束错误
  else if (err.name === 'SequelizeUniqueConstraintError') {
    error = handleSequelizeUniqueConstraintError(err)
  }
  
  // Sequelize外键约束错误
  else if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = handleSequelizeForeignKeyConstraintError(err)
  }
  
  // JWT错误
  else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError()
  }
  
  // JWT过期错误
  else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError()
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res)
  } else {
    sendErrorProd(error, res)
  }
}

/**
 * 异步错误捕获包装器
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}