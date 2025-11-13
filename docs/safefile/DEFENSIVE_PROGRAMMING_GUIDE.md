# 防御编程优化指南 (Defensive Programming Guide)

> **文档版本**: 1.0.0  
> **创建日期**: 2024-11-13  
> **适用项目**: LittleGameHub  
> **优先级标记**: 🔴 高优先级 | 🟡 中优先级 | 🟢 低优先级

## 📋 目录

1. [概述](#概述)
2. [输入验证与数据完整性](#输入验证与数据完整性)
3. [错误处理与异常管理](#错误处理与异常管理)
4. [安全性增强](#安全性增强)
5. [并发控制与数据一致性](#并发控制与数据一致性)
6. [资源管理与性能优化](#资源管理与性能优化)
7. [类型安全与代码质量](#类型安全与代码质量)
8. [日志、监控与审计](#日志监控与审计)
9. [测试策略](#测试策略)
10. [配置与环境管理](#配置与环境管理)
11. [实施优先级建议](#实施优先级建议)

---

## 概述

本文档从防御编程的角度分析 LittleGameHub 项目的潜在风险，并提供具体的优化建议和代码示例。防御编程的核心原则是：**假设一切都可能出错，提前预防而非事后补救**。

### 当前项目风险评估

| 风险类别 | 风险等级 | 影响范围 | 修复成本 |
|---------|---------|---------|---------|
| 输入验证不足 | 🔴 高 | 全局 | 中等 |
| 安全漏洞 | 🔴 高 | 认证/授权 | 高 |
| 并发竞态条件 | 🟡 中 | 用户注册/收藏 | 低 |
| 错误信息泄露 | 🟡 中 | API 响应 | 低 |
| 资源泄露风险 | 🟡 中 | 数据库/文件 | 中等 |
| 类型安全问题 | 🟢 低 | 代码库 | 低 |

---

## 输入验证与数据完整性

### 🔴 问题 1.1: 缺少 DTO 验证

**当前状态**: 控制器直接从 `req.body` 读取数据，没有验证层

**风险**:
- SQL 注入攻击
- XSS 攻击
- 恶意数据导致业务逻辑错误
- 数据库字段溢出

**当前代码** (`authController.ts`):
```typescript
export const register = catchAsync(async (req: Request, res: Response) => {
  const { username, email, password } = req.body  // ❌ 无验证
  // ...
})
```

**优化建议**:

#### 1.1.1 创建 DTO 类
```typescript
// backend/src/modules/auth/dto/register.dto.ts
import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength, 
  Matches,
  IsNotEmpty 
} from 'class-validator'
import { Transform } from 'class-transformer'
import DOMPurify from 'isomorphic-dompurify'

export class RegisterDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名至少 3 个字符' })
  @MaxLength(20, { message: '用户名最多 20 个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: '用户名只能包含字母、数字和下划线' 
  })
  @Transform(({ value }) => DOMPurify.sanitize(value?.trim()))
  username: string

  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(100, { message: '邮箱最多 100 个字符' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string

  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码至少 8 个字符' })
  @MaxLength(128, { message: '密码最多 128 个字符' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: '密码必须包含大小写字母、数字和特殊字符' }
  )
  password: string
}
```

#### 1.1.2 创建验证中间件
```typescript
// backend/src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { plainToClass } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import { AppError } from './errorHandler'

/**
 * 通用验证中间件
 */
export function validateDto(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 转换为 DTO 实例
      const dtoInstance = plainToClass(dtoClass, req.body)
      
      // 验证
      const errors: ValidationError[] = await validate(dtoInstance, {
        whitelist: true,        // 移除未定义的属性
        forbidNonWhitelisted: true,  // 拒绝未定义的属性
        forbidUnknownValues: true,   // 拒绝未知值
        skipMissingProperties: false
      })

      if (errors.length > 0) {
        const messages = errors.map(error => {
          return Object.values(error.constraints || {}).join(', ')
        })
        
        return next(new AppError(`输入验证失败: ${messages.join('; ')}`, 400))
      }

      // 替换 req.body 为验证后的 DTO
      req.body = dtoInstance
      next()
    } catch (error) {
      next(new AppError('请求数据格式错误', 400))
    }
  }
}
```

#### 1.1.3 在路由中使用
```typescript
// backend/src/routes/auth.routes.ts
import { validateDto } from '@/middleware/validation.middleware'
import { RegisterDto } from '@/modules/auth/dto/register.dto'

router.post('/register', 
  validateDto(RegisterDto),  // ✅ 添加验证
  authController.register
)
```

---

### 🔴 问题 1.2: 分页参数未限制边界

**当前代码** (`gameController.ts`):
```typescript
export const getGames = catchAsync(async (req: Request, res: Response) => {
  const pagination = getPaginationParams(req)  // ❌ 可能传入极大值
  // ...
})
```

**风险**:
- 恶意用户请求 `limit=999999999` 导致数据库负载过高
- 内存溢出
- 拒绝服务攻击 (DoS)

**优化建议**:
```typescript
// backend/src/utils/pagination.ts
const MAX_PAGE_SIZE = 100  // 最大每页数量
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_NUMBER = 10000  // 最大页码

export function getPaginationParams(req: Request | any): PaginationParams {
  let page = parseInt(req.query?.page || req.page || '1', 10)
  let limit = parseInt(req.query?.limit || req.limit || String(DEFAULT_PAGE_SIZE), 10)
  
  // ✅ 边界检查
  if (isNaN(page) || page < 1) {
    page = 1
  }
  if (page > MAX_PAGE_NUMBER) {
    page = MAX_PAGE_NUMBER
  }
  
  if (isNaN(limit) || limit < 1) {
    limit = DEFAULT_PAGE_SIZE
  }
  if (limit > MAX_PAGE_SIZE) {
    limit = MAX_PAGE_SIZE
  }
  
  const sortBy = req.query?.sortBy || req.sortBy || 'created_at'
  const sortOrder = (req.query?.sortOrder || req.sortOrder || 'DESC').toUpperCase()
  
  // ✅ 白名单验证排序字段
  const allowedSortFields = ['created_at', 'updated_at', 'title', 'play_count', 'rating']
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at'
  
  // ✅ 验证排序顺序
  const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'DESC'
  
  return {
    page,
    limit,
    sortBy: safeSortBy,
    sortOrder: safeSortOrder as 'ASC' | 'DESC'
  }
}
```

---

### 🔴 问题 1.3: 文件上传未验证

**当前代码** (`gameController.ts`):
```typescript
export const uploadGameCover = catchAsync(async (req, res) => {
  const file = req.file  // ❌ 未检查文件类型、大小
  // ...
})
```

**风险**:
- 上传恶意可执行文件
- 消耗磁盘空间
- 文件类型伪造攻击

**优化建议**:
```typescript
// backend/src/middleware/upload.middleware.ts
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import { AppError } from './errorHandler'

// 允许的图片 MIME 类型
const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]

// 允许的图片扩展名
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

// 最大文件大小 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/game-covers'))
  },
  filename: (req, file, cb) => {
    // ✅ 使用随机文件名防止文件名冲突和路径遍历攻击
    const uniqueName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // ✅ 验证 MIME 类型
  if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    return cb(new AppError('只允许上传图片文件 (JPG, PNG, WEBP, GIF)', 400))
  }
  
  // ✅ 验证文件扩展名
  const ext = path.extname(file.originalname).toLowerCase()
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return cb(new AppError('不支持的文件扩展名', 400))
  }
  
  cb(null, true)
}

export const uploadGameCoverMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
}).single('cover')

// ✅ 错误处理包装器
export const handleUploadError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('文件大小超过限制 (最大 5MB)', 400))
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('只能上传一个文件', 400))
    }
    return next(new AppError(`文件上传错误: ${err.message}`, 400))
  }
  next(err)
}
```

**使用方式**:
```typescript
router.post(
  '/games/:id/cover',
  authenticate,
  uploadGameCoverMiddleware,
  handleUploadError,
  gameController.uploadGameCover
)
```

---

## 错误处理与异常管理

### 🟡 问题 2.1: 错误信息可能泄露敏感信息

**当前代码** (`errorHandler.ts`):
```typescript
// 可能会将数据库错误直接返回给客户端
```

**风险**:
- 泄露数据库结构
- 泄露文件路径
- 泄露内部实现细节

**优化建议**:
```typescript
// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express'
import { logger } from '@/utils'

/**
 * 错误分类
 */
enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL = 'INTERNAL_ERROR'
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly type: ErrorType
  public readonly isOperational: boolean
  public readonly details?: any

  constructor(
    message: string,
    statusCode: number = 500,
    type: ErrorType = ErrorType.INTERNAL,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message)
    this.statusCode = statusCode
    this.type = type
    this.isOperational = isOperational
    this.details = details
    
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 错误处理中间件
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err

  // ✅ TypeORM 错误处理
  if (err.name === 'QueryFailedError') {
    error = handleDatabaseError(err)
  }

  // ✅ JWT 错误处理
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = new AppError('认证令牌无效或已过期', 401, ErrorType.AUTHENTICATION)
  }

  // ✅ Validation 错误处理
  if (err.name === 'ValidationError') {
    error = new AppError('输入数据验证失败', 400, ErrorType.VALIDATION)
  }

  const statusCode = (error as AppError).statusCode || 500
  const type = (error as AppError).type || ErrorType.INTERNAL
  const isOperational = (error as AppError).isOperational !== false

  // ✅ 记录详细错误日志（仅服务器端）
  if (!isOperational || statusCode >= 500) {
    logger.error('严重错误:', {
      message: error.message,
      stack: error.stack,
      type,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.id
    })
  } else {
    logger.warn('操作错误:', {
      message: error.message,
      type,
      url: req.originalUrl
    })
  }

  // ✅ 返回给客户端的安全错误信息
  const clientError: any = {
    status: 'error',
    type,
    message: error.message
  }

  // ✅ 开发环境返回详细信息，生产环境隐藏细节
  if (process.env.NODE_ENV === 'development') {
    clientError.stack = error.stack
    clientError.details = (error as AppError).details
  } else {
    // 生产环境对内部错误使用通用消息
    if (statusCode >= 500) {
      clientError.message = '服务器内部错误，请稍后重试'
    }
  }

  res.status(statusCode).json(clientError)
}

/**
 * 数据库错误处理
 */
function handleDatabaseError(err: any): AppError {
  // PostgreSQL 错误代码
  const code = err.code

  // ✅ 唯一约束冲突
  if (code === '23505') {
    return new AppError(
      '数据已存在，请检查输入',
      409,
      ErrorType.CONFLICT
    )
  }

  // ✅ 外键约束冲突
  if (code === '23503') {
    return new AppError(
      '关联数据不存在',
      400,
      ErrorType.VALIDATION
    )
  }

  // ✅ 非空约束冲突
  if (code === '23502') {
    return new AppError(
      '缺少必填字段',
      400,
      ErrorType.VALIDATION
    )
  }

  // ✅ 其他数据库错误（隐藏详情）
  return new AppError(
    '数据操作失败',
    500,
    ErrorType.DATABASE,
    false
  )
}
```

---

### 🟡 问题 2.2: 缺少重试机制

**风险**:
- 临时网络错误导致操作失败
- 邮件发送失败无重试

**优化建议**:
```typescript
// backend/src/utils/retry.ts
interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoff?: 'exponential' | 'linear'
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * 通用重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = 'exponential',
    onRetry
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt < maxAttempts) {
        // 计算延迟时间
        const delay = backoff === 'exponential' 
          ? delayMs * Math.pow(2, attempt - 1)
          : delayMs * attempt

        // 回调通知
        if (onRetry) {
          onRetry(attempt, lastError)
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

/**
 * 使用示例
 */
// 在 authController.ts 中
try {
  await retry(
    () => sendVerificationEmail(email, emailVerificationToken),
    {
      maxAttempts: 3,
      delayMs: 2000,
      backoff: 'exponential',
      onRetry: (attempt, error) => {
        logger.warn(`邮件发送失败，第 ${attempt} 次重试:`, error.message)
      }
    }
  )
} catch (error) {
  await userRepository.remove(user)
  return next(new AppError('验证邮件发送失败，请稍后再试', 500))
}
```

---

## 安全性增强

### 🔴 问题 3.1: JWT Token 无黑名单机制

**当前状态**: Token 签发后无法撤销

**风险**:
- 用户登出后 Token 仍然有效
- 密码修改后旧 Token 仍可使用
- 被盗 Token 无法禁用

**优化建议**:
```typescript
// backend/src/services/token-blacklist.service.ts
import { redisClient } from '@/config/redis.config'

class TokenBlacklistService {
  private readonly prefix = 'token:blacklist:'

  /**
   * 将 Token 加入黑名单
   */
  async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    const key = `${this.prefix}${token}`
    // 设置过期时间与 Token 剩余有效期一致
    await redisClient.setex(key, expiresIn, '1')
  }

  /**
   * 检查 Token 是否在黑名单中
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = `${this.prefix}${token}`
    const result = await redisClient.get(key)
    return result !== null
  }

  /**
   * 撤销用户的所有 Token（通过用户版本号）
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const versionKey = `user:token:version:${userId}`
    await redisClient.incr(versionKey)
  }

  /**
   * 获取用户 Token 版本号
   */
  async getUserTokenVersion(userId: string): Promise<number> {
    const versionKey = `user:token:version:${userId}`
    const version = await redisClient.get(versionKey)
    return parseInt(version || '0', 10)
  }
}

export const tokenBlacklistService = new TokenBlacklistService()
```

**在认证中间件中使用**:
```typescript
// backend/src/middleware/auth.ts
export const authenticate = catchAsync(async (req, res, next) => {
  const token = extractTokenFromHeader(req.headers.authorization)
  
  if (!token) {
    return next(new AppError('未提供认证令牌', 401))
  }

  // ✅ 检查黑名单
  const isBlacklisted = await tokenBlacklistService.isBlacklisted(token)
  if (isBlacklisted) {
    return next(new AppError('令牌已失效', 401))
  }

  const decoded = verifyToken(token)
  
  // ✅ 检查用户 Token 版本
  const currentVersion = await tokenBlacklistService.getUserTokenVersion(decoded.id)
  const tokenVersion = decoded.version || 0
  
  if (tokenVersion < currentVersion) {
    return next(new AppError('令牌已过期，请重新登录', 401))
  }

  // ... 继续验证
})
```

**在登出时使用**:
```typescript
export const logout = catchAsync(async (req, res) => {
  const token = extractTokenFromHeader(req.headers.authorization)
  const decoded = verifyToken(token!)
  
  // 计算 Token 剩余有效期
  const expiresIn = decoded.exp! - Math.floor(Date.now() / 1000)
  
  // ✅ 加入黑名单
  await tokenBlacklistService.addToBlacklist(token!, expiresIn)
  
  res.json({
    status: 'success',
    message: '登出成功'
  })
})
```

---

### 🔴 问题 3.2: 密码策略不够强

**当前状态**: 没有密码强度检查

**优化建议**:
```typescript
// backend/src/utils/password.ts
import zxcvbn from 'zxcvbn'

/**
 * 检查密码强度
 * @returns 强度评分 (0-4)，3 以上为强密码
 */
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
  isStrong: boolean
} {
  const result = zxcvbn(password)
  
  const feedback: string[] = []
  
  if (result.feedback.warning) {
    feedback.push(result.feedback.warning)
  }
  
  if (result.feedback.suggestions.length > 0) {
    feedback.push(...result.feedback.suggestions)
  }
  
  return {
    score: result.score,
    feedback,
    isStrong: result.score >= 3
  }
}

/**
 * 验证密码是否符合要求
 */
export function validatePassword(password: string): void {
  // 基本长度检查
  if (password.length < 8) {
    throw new Error('密码长度至少 8 个字符')
  }
  
  if (password.length > 128) {
    throw new Error('密码长度最多 128 个字符')
  }
  
  // 复杂度检查
  const hasLowerCase = /[a-z]/.test(password)
  const hasUpperCase = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecialChar = /[@$!%*?&]/.test(password)
  
  const complexityCount = [hasLowerCase, hasUpperCase, hasDigit, hasSpecialChar]
    .filter(Boolean).length
  
  if (complexityCount < 3) {
    throw new Error('密码必须包含以下至少 3 种：小写字母、大写字母、数字、特殊字符')
  }
  
  // 强度检查
  const strengthCheck = checkPasswordStrength(password)
  if (!strengthCheck.isStrong) {
    throw new Error(`密码强度不足: ${strengthCheck.feedback.join('; ')}`)
  }
  
  // 常见密码黑名单
  const commonPasswords = [
    'password', '12345678', 'qwerty123', 'admin123',
    'Password123!', 'Welcome123!'
  ]
  
  if (commonPasswords.some(common => 
    password.toLowerCase().includes(common.toLowerCase())
  )) {
    throw new Error('密码过于常见，请使用更复杂的密码')
  }
}
```

---

### 🔴 问题 3.3: 缺少 CSRF 保护

**优化建议**:
```typescript
// backend/src/middleware/csrf.middleware.ts
import csrf from 'csurf'
import { AppError } from './errorHandler'

// CSRF 保护中间件（仅对状态改变的操作启用）
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
})

// CSRF 错误处理
export const handleCsrfError = (err: any, req: any, res: any, next: any) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return next(new AppError('CSRF 验证失败', 403))
  }
  next(err)
}

// 提供 CSRF Token 的路由
export const getCsrfToken = (req: any, res: any) => {
  res.json({
    status: 'success',
    data: {
      csrfToken: req.csrfToken()
    }
  })
}
```

**使用方式**:
```typescript
// 在 app.ts 中
import { csrfProtection, handleCsrfError, getCsrfToken } from '@/middleware/csrf.middleware'

// 获取 CSRF Token 的端点
app.get('/api/csrf-token', csrfProtection, getCsrfToken)

// 对状态改变的路由启用 CSRF 保护
app.use('/api/auth/register', csrfProtection)
app.use('/api/auth/login', csrfProtection)
app.post('/api/games', csrfProtection)
// ...

app.use(handleCsrfError)
```

---

### 🟡 问题 3.4: 缺少请求频率限制细粒度控制

**当前状态**: 有基本的 rate limiter，但不够细致

**优化建议**:
```typescript
// backend/src/middleware/advanced-rate-limiter.ts
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { redisClient } from '@/config/redis.config'
import { AppError } from './errorHandler'

/**
 * 按用户 ID 限流
 */
export const userBasedLimiter = (options: {
  windowMs: number
  max: number
  message?: string
}) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:user:'
    }),
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || '请求过于频繁，请稍后再试',
    keyGenerator: (req: any) => {
      // 已登录用户按 ID 限流
      if (req.user?.id) {
        return `user:${req.user.id}`
      }
      // 未登录用户按 IP 限流
      return `ip:${req.ip}`
    },
    handler: (req, res, next) => {
      next(new AppError('请求过于频繁，请稍后再试', 429))
    }
  })
}

/**
 * 防止暴力破解
 */
export const bruteForceProtection = rateLimit({
  store: new RedisStore({
    client: redisClient as any,
    prefix: 'rl:bruteforce:'
  }),
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 5, // 最多 5 次失败尝试
  skipSuccessfulRequests: true, // 成功的请求不计数
  keyGenerator: (req) => {
    const identifier = req.body.email || req.body.username || req.ip
    return `auth:${identifier}`
  },
  handler: (req, res, next) => {
    next(new AppError('登录尝试次数过多，请 15 分钟后再试', 429))
  }
})

/**
 * 昂贵操作限流（如导出、批量操作）
 */
export const expensiveOperationLimiter = userBasedLimiter({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 10,
  message: '操作过于频繁，每小时最多 10 次'
})
```

---

## 并发控制与数据一致性

### 🟡 问题 4.1: 注册存在竞态条件

**当前代码** (`authController.ts`):
```typescript
// 检查用户名是否存在
const existingUser = await userRepository.findByUsername(username)
if (existingUser) {
  return next(new AppError('用户名已存在', 400))
}
// 创建用户
await userRepository.save(user)  // ❌ 可能同时创建重复用户
```

**风险**: 两个请求同时通过检查，导致创建重复用户

**优化建议**:
```typescript
// 方案 1: 使用数据库唯一约束 + 捕获错误
export const register = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body
  const userRepository = getUserRepositoryInstance()

  try {
    // 直接创建，依赖数据库唯一约束
    const user = userRepository.create({
      nickname: username,
      email,
      password_hash: await hashPassword(password),
      email_verification_token: generateRandomToken(32)
    })
    
    await userRepository.save(user)  // ✅ 数据库会拒绝重复
    
    // ... 发送邮件等
  } catch (error: any) {
    // ✅ 处理唯一约束冲突
    if (error.code === '23505') {  // PostgreSQL 唯一约束错误
      if (error.detail.includes('email')) {
        return next(new AppError('邮箱已被注册', 400))
      }
      if (error.detail.includes('nickname')) {
        return next(new AppError('用户名已存在', 400))
      }
    }
    throw error
  }
})

// 方案 2: 使用分布式锁
import Redlock from 'redlock'

export const registerWithLock = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body
  const userRepository = getUserRepositoryInstance()
  
  const redlock = new Redlock([redisClient])
  const lockKey = `lock:register:${email}`
  
  try {
    // ✅ 获取分布式锁
    const lock = await redlock.acquire([lockKey], 5000)  // 5秒超时
    
    try {
      // 检查用户是否存在
      const existingUser = await userRepository.findByEmail(email)
      if (existingUser) {
        return next(new AppError('邮箱已被注册', 400))
      }
      
      // 创建用户
      const user = userRepository.create({
        nickname: username,
        email,
        password_hash: await hashPassword(password),
        email_verification_token: generateRandomToken(32)
      })
      
      await userRepository.save(user)
      
      // ... 发送邮件等
    } finally {
      // ✅ 释放锁
      await lock.release()
    }
  } catch (error) {
    if (error instanceof Redlock.LockError) {
      return next(new AppError('请求处理中，请稍后再试', 409))
    }
    throw error
  }
})
```

---

### 🟡 问题 4.2: 收藏/取消收藏没有事务保护

**优化建议**:
```typescript
// backend/src/controllers/favoriteController.ts
export const addFavorite = catchAsync(async (req, res, next) => {
  const { userId, gameId } = req.body
  
  // ✅ 使用事务
  await AppDataSource.transaction(async (manager) => {
    const favoriteRepo = manager.getRepository(Favorite)
    const gameRepo = manager.getRepository(Game)
    
    // 检查是否已收藏
    const existing = await favoriteRepo.findOne({
      where: { userId, gameId }
    })
    
    if (existing) {
      throw new AppError('已经收藏过该游戏', 400)
    }
    
    // 创建收藏
    const favorite = favoriteRepo.create({ userId, gameId })
    await favoriteRepo.save(favorite)
    
    // 增加游戏收藏计数
    await gameRepo
      .createQueryBuilder()
      .update()
      .set({ favoriteCount: () => 'favorite_count + 1' })
      .where('id = :gameId', { gameId })
      .execute()
  })
  
  res.status(201).json({
    status: 'success',
    message: '收藏成功'
  })
})
```

---

## 资源管理与性能优化

### 🟡 问题 5.1: 数据库连接没有超时设置

**优化建议**:
```typescript
// backend/src/config/database.config.ts
export const databaseConfig: DataSourceOptions = {
  // ... 其他配置
  
  // ✅ 连接池配置
  extra: {
    max: 20,                    // 最大连接数
    min: 5,                     // 最小连接数
    acquireConnectionTimeout: 30000,  // 获取连接超时 (30s)
    idleTimeoutMillis: 30000,   // 空闲连接超时
    connectionTimeoutMillis: 5000,    // 连接超时
    statementTimeout: 10000,    // SQL 执行超时 (10s)
  },
  
  // ✅ 连接健康检查
  poolErrorHandler: (err) => {
    logger.error('数据库连接池错误:', err)
  }
}

// ✅ 定期检查数据库连接健康
import { setInterval } from 'timers'

export function startDatabaseHealthCheck() {
  setInterval(async () => {
    try {
      await checkDatabaseHealth()
    } catch (error) {
      logger.error('数据库健康检查失败:', error)
      // 可以触发告警
    }
  }, 60000)  // 每分钟检查一次
}
```

---

### 🟡 问题 5.2: 查询没有索引优化

**优化建议**:
```typescript
// backend/src/modules/games/entities/game.entity.ts
@Entity('games')
@Index(['title'])  // ✅ 标题搜索索引
@Index(['category_tags'], { spatial: false })  // ✅ 标签搜索
@Index(['availability_status', 'is_featured'])  // ✅ 复合索引
@Index(['created_at'])  // ✅ 排序索引
@Index(['play_count'])  // ✅ 热门排序
export class Game {
  // ...
}

// backend/src/modules/users/entities/user.entity.ts
@Entity('users')
@Index(['email'], { unique: true })  // ✅ 唯一索引
@Index(['nickname'], { unique: true })
@Index(['is_active', 'is_email_verified'])  // ✅ 状态查询
export class User {
  // ...
}
```

---

### 🟢 问题 5.3: 缺少查询结果缓存

**优化建议**:
```typescript
// backend/src/utils/cache.ts
import { redisClient } from '@/config/redis.config'

/**
 * 缓存装饰器
 */
export function Cacheable(options: {
  ttl: number  // 缓存时间（秒）
  keyGenerator?: (...args: any[]) => string
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // 生成缓存键
      const cacheKey = options.keyGenerator
        ? options.keyGenerator(...args)
        : `cache:${propertyKey}:${JSON.stringify(args)}`

      // 尝试从缓存获取
      const cached = await redisClient.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args)

      // 存入缓存
      await redisClient.setex(cacheKey, options.ttl, JSON.stringify(result))

      return result
    }

    return descriptor
  }
}

/**
 * 使用示例
 */
class GameRepository extends BaseRepository<Game> {
  @Cacheable({
    ttl: 300,  // 5 分钟
    keyGenerator: (id: string) => `game:${id}`
  })
  async findById(id: string): Promise<Game | null> {
    return super.findById(id)
  }

  @Cacheable({
    ttl: 60,
    keyGenerator: (page: number, limit: number) => `games:featured:${page}:${limit}`
  })
  async findFeaturedGames(pagination: PaginationParams) {
    // ...
  }
}
```

---

## 类型安全与代码质量

### 🟢 问题 6.1: 使用 `any` 类型过多

**优化建议**:
```typescript
// ❌ 不好的做法
const filters: any = {}

// ✅ 好的做法
interface GameFilters {
  availabilityStatus?: GameAvailabilityStatus
  q?: string
  genre?: string
  platform?: string
  isFree?: boolean
  isFeatured?: boolean
  minRating?: number
  maxRating?: number
}

const filters: GameFilters = {}
```

---

### 🟢 问题 6.2: TypeScript 配置不够严格

**优化建议**:
```json
// backend/tsconfig.json
{
  "compilerOptions": {
    // ✅ 启用严格模式
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // ✅ 额外检查
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    
    // ✅ 导入检查
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## 日志、监控与审计

### 🟡 问题 7.1: 缺少敏感操作审计日志

**优化建议**:
```typescript
// backend/src/services/audit-log.service.ts
import { AppDataSource } from '@/config/database.config'

enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ROLE_CHANGE = 'ROLE_CHANGE',
  DATA_EXPORT = 'DATA_EXPORT',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS'
}

@Entity('audit_logs')
class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar' })
  action: AuditAction

  @Column({ type: 'uuid', nullable: true })
  userId: string | null

  @Column({ type: 'varchar', nullable: true })
  userEmail: string | null

  @Column({ type: 'inet' })
  ipAddress: string

  @Column({ type: 'text', nullable: true })
  userAgent: string | null

  @Column({ type: 'jsonb', nullable: true })
  metadata: any

  @Column({ type: 'varchar', nullable: true })
  resource: string | null

  @Column({ type: 'varchar', nullable: true })
  resourceId: string | null

  @Column({ type: 'boolean', default: true })
  success: boolean

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null

  @CreateDateColumn()
  createdAt: Date
}

class AuditLogService {
  async log(data: {
    action: AuditAction
    userId?: string
    userEmail?: string
    ipAddress: string
    userAgent?: string
    metadata?: any
    resource?: string
    resourceId?: string
    success?: boolean
    errorMessage?: string
  }): Promise<void> {
    const repo = AppDataSource.getRepository(AuditLog)
    const log = repo.create({
      ...data,
      success: data.success !== false
    })
    await repo.save(log)
  }

  async getUserActivity(userId: string, limit: number = 100) {
    const repo = AppDataSource.getRepository(AuditLog)
    return repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit
    })
  }
}

export const auditLogService = new AuditLogService()
```

**使用方式**:
```typescript
// 在 authController.ts 中
export const login = catchAsync(async (req, res, next) => {
  // ... 登录逻辑
  
  // ✅ 记录审计日志
  await auditLogService.log({
    action: AuditAction.USER_LOGIN,
    userId: user.id,
    userEmail: user.email,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: true
  })
  
  res.json({ /* ... */ })
})
```

---

### 🟡 问题 7.2: 缺少性能监控

**优化建议**:
```typescript
// backend/src/middleware/performance.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { logger } from '@/utils'

/**
 * 性能监控中间件
 */
export const performanceMonitoring = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now()
  const requestId = req.headers['x-request-id'] || crypto.randomUUID()

  // 设置请求 ID
  req.headers['x-request-id'] = requestId
  res.setHeader('X-Request-ID', requestId)

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }

    // ✅ 慢查询告警
    if (duration > 3000) {
      logger.warn('慢请求检测:', logData)
    } else {
      logger.info('请求完成:', logData)
    }

    // ✅ 发送到监控系统（如 Prometheus、DataDog）
    // metricsService.recordHttpRequest({
    //   method: req.method,
    //   route: req.route?.path || req.originalUrl,
    //   statusCode: res.statusCode,
    //   duration
    // })
  })

  next()
}
```

---

## 测试策略

### 🔴 问题 8.1: 缺少单元测试

**优化建议**:
```typescript
// backend/src/controllers/__tests__/authController.test.ts
import request from 'supertest'
import { app } from '@/app'
import { AppDataSource } from '@/config/database.config'
import { getUserRepositoryInstance } from '@/repositories'

describe('AuthController', () => {
  beforeAll(async () => {
    await AppDataSource.initialize()
  })

  afterAll(async () => {
    await AppDataSource.destroy()
  })

  beforeEach(async () => {
    // 清理测试数据
    const userRepo = getUserRepositoryInstance()
    await userRepo.remove(await userRepo.find())
  })

  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test@123456'
        })
        .expect(201)

      expect(response.body).toMatchObject({
        status: 'success',
        data: {
          user: {
            username: 'testuser',
            email: 'test@example.com'
          },
          token: expect.any(String),
          refreshToken: expect.any(String)
        }
      })
    })

    it('应该拒绝弱密码', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123456'  // 弱密码
        })
        .expect(400)

      expect(response.body.message).toContain('密码')
    })

    it('应该拒绝重复的邮箱', async () => {
      // 第一次注册
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user1',
          email: 'test@example.com',
          password: 'Test@123456'
        })

      // 第二次注册相同邮箱
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'test@example.com',
          password: 'Test@123456'
        })
        .expect(400)

      expect(response.body.message).toContain('邮箱已被注册')
    })
  })
})
```

---

## 配置与环境管理

### 🟡 问题 9.1: 环境变量缺少验证

**优化建议**:
```typescript
// backend/src/config/env.ts
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

// ✅ 环境变量验证 Schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('8000'),
  
  // 数据库
  DB_HOST: z.string().min(1, '数据库主机不能为空'),
  DB_PORT: z.string().regex(/^\d+$/).transform(Number),
  DB_USER: z.string().min(1, '数据库用户名不能为空'),
  DB_PASSWORD: z.string().min(1, '数据库密码不能为空'),
  DB_NAME: z.string().min(1, '数据库名称不能为空'),
  DB_SSL: z.string().transform(val => val === 'true').default('false'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT 密钥至少 32 个字符'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT 刷新密钥至少 32 个字符'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().regex(/^\d+$/).transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // 前端 URL
  FRONTEND_URL: z.string().url().optional(),
  
  // 邮件
  SMTP_HOST: z.string().min(1, 'SMTP 主机不能为空'),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number),
  SMTP_USER: z.string().email('SMTP 用户必须是有效邮箱'),
  SMTP_PASSWORD: z.string().min(1, 'SMTP 密码不能为空'),
  SMTP_FROM: z.string().email('发件人地址必须是有效邮箱'),
})

// ✅ 验证环境变量
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      console.error('❌ 环境变量验证失败:')
      console.error(messages.join('\n'))
      process.exit(1)
    }
    throw error
  }
}

export const env = validateEnv()

// ✅ 打印配置（隐藏敏感信息）
if (env.NODE_ENV === 'development') {
  console.log('🔧 配置已加载:')
  console.log({
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    DB_HOST: env.DB_HOST,
    DB_NAME: env.DB_NAME,
    DB_USER: env.DB_USER,
    DB_PASSWORD: '***',  // 隐藏密码
    JWT_SECRET: env.JWT_SECRET.substring(0, 10) + '...',
    REDIS_HOST: env.REDIS_HOST,
    SMTP_HOST: env.SMTP_HOST
  })
}
```

---

## 实施优先级建议

### 🔴 第一阶段（高优先级 - 1-2 周）

1. **输入验证**
   - [ ] 实现 DTO 验证系统
   - [ ] 添加分页参数边界检查
   - [ ] 实现文件上传验证

2. **安全性**
   - [ ] 实现 JWT 黑名单机制
   - [ ] 增强密码策略
   - [ ] 添加 CSRF 保护
   - [ ] 改进 rate limiting

3. **错误处理**
   - [ ] 优化错误处理中间件
   - [ ] 隐藏敏感错误信息
   - [ ] 实现重试机制

4. **审计日志**
   - [ ] 实现审计日志系统
   - [ ] 记录敏感操作

### 🟡 第二阶段（中优先级 - 2-4 周）

1. **并发控制**
   - [ ] 解决注册竞态条件
   - [ ] 为关键操作添加事务
   - [ ] 实现分布式锁

2. **资源管理**
   - [ ] 优化数据库连接配置
   - [ ] 添加查询超时
   - [ ] 实现数据库健康检查

3. **性能优化**
   - [ ] 添加数据库索引
   - [ ] 实现查询结果缓存
   - [ ] 优化 N+1 查询问题

4. **监控**
   - [ ] 实现性能监控
   - [ ] 添加慢查询告警
   - [ ] 集成 APM 工具

### 🟢 第三阶段（低优先级 - 持续进行）

1. **代码质量**
   - [ ] 减少 `any` 类型使用
   - [ ] 启用严格的 TypeScript 检查
   - [ ] 代码审查和重构

2. **测试**
   - [ ] 编写单元测试
   - [ ] 编写集成测试
   - [ ] 实现 E2E 测试
   - [ ] 达到 80%+ 代码覆盖率

3. **配置管理**
   - [ ] 实现环境变量验证
   - [ ] 创建配置文档
   - [ ] 实现配置热重载

4. **文档**
   - [ ] 完善 API 文档
   - [ ] 编写开发者指南
   - [ ] 创建故障排除文档

---

## 附录：快速检查清单

### 代码审查检查清单

在提交代码前，请确保：

- [ ] 所有用户输入都经过验证
- [ ] 所有数据库查询都有索引支持
- [ ] 敏感操作都有审计日志
- [ ] 错误处理不泄露敏感信息
- [ ] 使用了适当的 HTTP 状态码
- [ ] API 响应格式统一
- [ ] 没有硬编码的密钥或密码
- [ ] 关键操作有事务保护
- [ ] 文件上传有大小和类型限制
- [ ] 数据库查询有分页限制
- [ ] 昂贵操作有 rate limiting
- [ ] 所有异步操作有错误处理
- [ ] 资源使用后正确释放
- [ ] 添加了适当的单元测试
- [ ] 更新了相关文档

### 安全检查清单

- [ ] 密码使用强哈希算法（bcrypt/argon2）
- [ ] JWT Token 包含必要的声明
- [ ] 敏感操作需要重新认证
- [ ] API 有 CORS 配置
- [ ] 使用 HTTPS（生产环境）
- [ ] 设置了安全响应头（Helmet）
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] CSRF 防护
- [ ] 文件上传路径遍历防护
- [ ] Rate limiting 已启用
- [ ] 日志不包含敏感信息

---

## 结语

本文档提供了全面的防御编程优化建议。请根据项目实际情况和优先级逐步实施。防御编程是一个持续的过程，需要团队的共同努力和代码审查机制的支持。

**记住**: 安全和健壮性不是一次性的工作，而是需要在整个开发生命周期中持续关注的目标。

---

**文档维护**: 请定期更新本文档，添加新发现的问题和最佳实践。

**联系人**: 技术负责人  
**最后更新**: 2024-11-13

