import winston from 'winston'
import path from 'path'

// 日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// 日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

// 添加颜色到winston
winston.addColors(colors)

// 日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// 生产环境日志格式
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// 传输器配置
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : format
  }),
  
  // 错误日志文件
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: productionFormat
  }),
  
  // 所有日志文件
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    format: productionFormat
  }),
]

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: productionFormat,
  transports,
  exitOnError: false,
})

/**
 * 创建带有上下文的日志记录器
 */
export function createContextLogger(context: string) {
  return {
    error: (message: string, meta?: any) => logger.error(`[${context}] ${message}`, meta),
    warn: (message: string, meta?: any) => logger.warn(`[${context}] ${message}`, meta),
    info: (message: string, meta?: any) => logger.info(`[${context}] ${message}`, meta),
    http: (message: string, meta?: any) => logger.http(`[${context}] ${message}`, meta),
    debug: (message: string, meta?: any) => logger.debug(`[${context}] ${message}`, meta),
  }
}

/**
 * 记录HTTP请求
 */
export const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/http.log')
    })
  ]
})

export { logger }