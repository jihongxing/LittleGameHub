# 防御编程快速参考指南

> 本文档提供常见场景的防御编程代码模板和最佳实践  
> 🔖 建议收藏到浏览器书签以便快速查阅

## 📑 目录

- [输入验证](#输入验证)
- [错误处理](#错误处理)
- [安全模式](#安全模式)
- [数据库操作](#数据库操作)
- [API 设计](#api-设计)
- [文件处理](#文件处理)
- [常见陷阱](#常见陷阱)

---

## 输入验证

### ✅ 创建 DTO

```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator'
import { Transform } from 'class-transformer'
import DOMPurify from 'isomorphic-dompurify'

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/)
  @Transform(({ value }) => DOMPurify.sanitize(value?.trim()))
  username: string

  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  password: string
}
```

### ✅ 在路由中使用验证

```typescript
import { validateDto } from '@/middleware/validation.middleware'
import { CreateUserDto } from './dto/create-user.dto'

router.post('/users', 
  validateDto(CreateUserDto),  // 验证中间件
  userController.createUser
)
```

### ✅ 分页参数验证

```typescript
function getPaginationParams(req: Request): PaginationParams {
  const MAX_PAGE_SIZE = 100
  const DEFAULT_PAGE_SIZE = 10
  
  let page = parseInt(req.query.page as string, 10)
  let limit = parseInt(req.query.limit as string, 10)
  
  // 边界检查
  page = isNaN(page) || page < 1 ? 1 : Math.min(page, 10000)
  limit = isNaN(limit) || limit < 1 ? DEFAULT_PAGE_SIZE : Math.min(limit, MAX_PAGE_SIZE)
  
  // 白名单验证排序字段
  const allowedSortFields = ['created_at', 'updated_at', 'name']
  const sortBy = allowedSortFields.includes(req.query.sortBy as string) 
    ? req.query.sortBy 
    : 'created_at'
  
  const sortOrder = ['ASC', 'DESC'].includes(req.query.sortOrder as string)
    ? req.query.sortOrder
    : 'DESC'
  
  return { page, limit, sortBy, sortOrder }
}
```

---

## 错误处理

### ✅ 自定义错误类

```typescript
enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL = 'INTERNAL_ERROR'
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public type: ErrorType = ErrorType.INTERNAL,
    public isOperational: boolean = true
  ) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}
```

### ✅ 使用错误类

```typescript
// 验证错误
throw new AppError('用户名已存在', 400, ErrorType.VALIDATION)

// 认证错误
throw new AppError('未授权', 401, ErrorType.AUTHENTICATION)

// 未找到
throw new AppError('用户不存在', 404, ErrorType.NOT_FOUND)

// 冲突
throw new AppError('资源已存在', 409, ErrorType.CONFLICT)

// 内部错误
throw new AppError('服务器内部错误', 500, ErrorType.INTERNAL)
```

### ✅ 捕获并处理错误

```typescript
export const someController = catchAsync(async (req, res, next) => {
  try {
    // 业务逻辑
    const result = await someService.doSomething()
    res.json({ status: 'success', data: result })
  } catch (error) {
    // 具体错误处理
    if (error.code === '23505') {
      return next(new AppError('数据已存在', 409, ErrorType.CONFLICT))
    }
    // 传递给全局错误处理器
    next(error)
  }
})
```

### ✅ 重试机制

```typescript
import { retry } from '@/utils/retry'

// 带重试的异步操作
const result = await retry(
  () => sendEmail(to, subject, content),
  {
    maxAttempts: 3,
    delayMs: 2000,
    backoff: 'exponential',
    onRetry: (attempt, error) => {
      logger.warn(`重试第 ${attempt} 次:`, error.message)
    }
  }
)
```

---

## 安全模式

### ✅ JWT Token 黑名单

```typescript
// 登出时加入黑名单
export const logout = catchAsync(async (req, res) => {
  const token = extractTokenFromHeader(req.headers.authorization)
  const decoded = verifyToken(token!)
  const expiresIn = decoded.exp! - Math.floor(Date.now() / 1000)
  
  await tokenBlacklistService.addToBlacklist(token!, expiresIn)
  
  res.json({ status: 'success', message: '登出成功' })
})

// 认证时检查黑名单
export const authenticate = catchAsync(async (req, res, next) => {
  const token = extractTokenFromHeader(req.headers.authorization)
  
  if (!token) {
    return next(new AppError('未提供令牌', 401))
  }
  
  // 检查黑名单
  const isBlacklisted = await tokenBlacklistService.isBlacklisted(token)
  if (isBlacklisted) {
    return next(new AppError('令牌已失效', 401))
  }
  
  const decoded = verifyToken(token)
  req.user = decoded
  next()
})
```

### ✅ 密码验证

```typescript
import { checkPasswordStrength } from '@/utils/password'

function validatePassword(password: string): void {
  // 长度检查
  if (password.length < 8 || password.length > 128) {
    throw new Error('密码长度必须在 8-128 个字符之间')
  }
  
  // 复杂度检查
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecial = /[@$!%*?&]/.test(password)
  
  const complexityCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length
  if (complexityCount < 3) {
    throw new Error('密码必须包含至少 3 种字符类型')
  }
  
  // 强度检查
  const strength = checkPasswordStrength(password)
  if (!strength.isStrong) {
    throw new Error(`密码强度不足: ${strength.feedback.join('; ')}`)
  }
}
```

### ✅ Rate Limiting

```typescript
// 通用限流
import { generalLimiter } from '@/middleware/rateLimiter'
router.use('/api', generalLimiter)

// 登录防暴力破解
import { bruteForceProtection } from '@/middleware/advanced-rate-limiter'
router.post('/auth/login', bruteForceProtection, authController.login)

// 按用户限流
import { userBasedLimiter } from '@/middleware/advanced-rate-limiter'
router.post('/export', 
  authenticate,
  userBasedLimiter({ windowMs: 3600000, max: 10 }),
  exportController.export
)
```

### ✅ CSRF 保护

```typescript
import { csrfProtection } from '@/middleware/csrf.middleware'

// 获取 CSRF Token
router.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})

// 保护状态改变的路由
router.post('/users', csrfProtection, userController.createUser)
router.put('/users/:id', csrfProtection, userController.updateUser)
router.delete('/users/:id', csrfProtection, userController.deleteUser)
```

---

## 数据库操作

### ✅ 使用事务

```typescript
import { AppDataSource } from '@/config/database.config'

export const transferPoints = catchAsync(async (req, res, next) => {
  const { fromUserId, toUserId, amount } = req.body
  
  // 使用事务确保原子性
  await AppDataSource.transaction(async (manager) => {
    const userRepo = manager.getRepository(User)
    
    // 减少发送方积分
    const sender = await userRepo.findOne({ where: { id: fromUserId } })
    if (!sender || sender.points < amount) {
      throw new AppError('积分不足', 400)
    }
    sender.points -= amount
    await userRepo.save(sender)
    
    // 增加接收方积分
    const receiver = await userRepo.findOne({ where: { id: toUserId } })
    if (!receiver) {
      throw new AppError('接收方不存在', 404)
    }
    receiver.points += amount
    await userRepo.save(receiver)
    
    // 记录交易
    const transaction = manager.getRepository(Transaction).create({
      fromUserId,
      toUserId,
      amount,
      type: 'TRANSFER'
    })
    await manager.save(transaction)
  })
  
  res.json({ status: 'success', message: '转账成功' })
})
```

### ✅ 防止竞态条件

```typescript
// 方案 1: 依赖数据库唯一约束
try {
  const user = userRepository.create({ username, email })
  await userRepository.save(user)
} catch (error: any) {
  if (error.code === '23505') {  // 唯一约束冲突
    throw new AppError('用户已存在', 409)
  }
  throw error
}

// 方案 2: 使用分布式锁
import Redlock from 'redlock'

const redlock = new Redlock([redisClient])
const lock = await redlock.acquire([`lock:user:${email}`], 5000)

try {
  const existing = await userRepository.findByEmail(email)
  if (existing) {
    throw new AppError('邮箱已注册', 400)
  }
  await userRepository.save(user)
} finally {
  await lock.release()
}
```

### ✅ 查询优化

```typescript
// ❌ 不好 - N+1 查询问题
const games = await gameRepository.find()
for (const game of games) {
  game.developer = await developerRepository.findOne({ where: { id: game.developerId } })
}

// ✅ 好 - 使用 JOIN
const games = await gameRepository
  .createQueryBuilder('game')
  .leftJoinAndSelect('game.developer', 'developer')
  .getMany()

// ✅ 使用索引
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.is_active = :isActive', { isActive: true })  // 使用索引字段
  .andWhere('user.email LIKE :email', { email: `%${keyword}%` })
  .getMany()
```

### ✅ 使用缓存

```typescript
import { Cacheable } from '@/utils/cache'

class GameRepository extends BaseRepository<Game> {
  // 缓存单个游戏
  @Cacheable({
    ttl: 300,  // 5 分钟
    keyGenerator: (id: string) => `game:${id}`
  })
  async findById(id: string): Promise<Game | null> {
    return super.findById(id)
  }
  
  // 缓存游戏列表
  @Cacheable({
    ttl: 60,
    keyGenerator: (page: number, limit: number) => `games:${page}:${limit}`
  })
  async findAll(page: number, limit: number) {
    return this.findWithPagination({}, { page, limit })
  }
  
  // 更新时清除缓存
  async update(id: string, data: any): Promise<void> {
    await super.update({ id }, data)
    await redisClient.del(`game:${id}`)  // 清除缓存
  }
}
```

---

## API 设计

### ✅ 统一响应格式

```typescript
// 成功响应
res.status(200).json({
  status: 'success',
  data: {
    user: userObject
  }
})

// 分页响应
res.status(200).json({
  status: 'success',
  data: {
    items: gamesList,
    pagination: {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10
    }
  }
})

// 错误响应
res.status(400).json({
  status: 'error',
  type: 'VALIDATION_ERROR',
  message: '输入验证失败'
})
```

### ✅ RESTful 路由设计

```typescript
// 资源集合
router.get('/api/games', gameController.getGames)          // 获取列表
router.post('/api/games', gameController.createGame)       // 创建
router.get('/api/games/:id', gameController.getGame)       // 获取单个
router.put('/api/games/:id', gameController.updateGame)    // 更新
router.delete('/api/games/:id', gameController.deleteGame) // 删除

// 嵌套资源
router.get('/api/games/:id/reviews', reviewController.getGameReviews)
router.post('/api/games/:id/reviews', reviewController.createReview)

// 特殊操作
router.post('/api/games/:id/favorite', gameController.addToFavorite)
router.delete('/api/games/:id/favorite', gameController.removeFromFavorite)
```

### ✅ 版本控制

```typescript
// 方案 1: URL 版本
router.use('/api/v1/games', v1GamesRouter)
router.use('/api/v2/games', v2GamesRouter)

// 方案 2: Header 版本
app.use((req, res, next) => {
  const version = req.headers['api-version'] || '1.0'
  req.apiVersion = version
  next()
})
```

---

## 文件处理

### ✅ 安全的文件上传

```typescript
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: (req, file, cb) => {
    // 随机文件名防止冲突
    const uniqueName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // MIME 类型验证
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new AppError('只允许上传图片文件', 400))
  }
  
  // 文件扩展名验证
  const ext = path.extname(file.originalname).toLowerCase()
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    return cb(new AppError('不支持的文件类型', 400))
  }
  
  cb(null, true)
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
}).single('file')
```

### ✅ 文件路径安全

```typescript
import path from 'path'

function getSecureFilePath(filename: string): string {
  // 移除路径遍历字符
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  // 确保在安全目录内
  const uploadDir = path.join(__dirname, '../../uploads')
  const filePath = path.join(uploadDir, sanitized)
  
  // 验证路径
  if (!filePath.startsWith(uploadDir)) {
    throw new AppError('非法的文件路径', 400)
  }
  
  return filePath
}
```

---

## 常见陷阱

### ❌ 不要这样做

```typescript
// ❌ 1. 直接使用用户输入构建查询
const query = `SELECT * FROM users WHERE name = '${req.query.name}'`

// ❌ 2. 不验证分页参数
const limit = req.query.limit  // 可能是 9999999

// ❌ 3. 泄露敏感信息
res.json({ user: user })  // 包含 password_hash

// ❌ 4. 不处理错误
const user = await userRepository.findOne({ where: { id } })
user.update(...)  // user 可能是 null

// ❌ 5. 使用 any 类型
const data: any = req.body

// ❌ 6. 不使用事务
await decrementUserPoints(userId, 100)
await incrementGamePoints(gameId, 100)  // 如果这里失败，第一步无法回滚

// ❌ 7. 明文存储密码
user.password = req.body.password

// ❌ 8. 没有速率限制
router.post('/api/send-email', emailController.send)

// ❌ 9. 忽略资源清理
const stream = fs.createReadStream(file)
// 没有 stream.close()

// ❌ 10. 硬编码密钥
const JWT_SECRET = 'my-secret-key'
```

### ✅ 应该这样做

```typescript
// ✅ 1. 使用参数化查询
const user = await userRepository.findOne({ 
  where: { name: req.query.name } 
})

// ✅ 2. 验证并限制分页参数
const limit = Math.min(parseInt(req.query.limit) || 10, 100)

// ✅ 3. 过滤敏感字段
const { password_hash, ...safeUser } = user
res.json({ user: safeUser })

// ✅ 4. 检查 null/undefined
const user = await userRepository.findOne({ where: { id } })
if (!user) {
  throw new AppError('用户不存在', 404)
}
user.update(...)

// ✅ 5. 使用具体类型
interface RequestBody {
  username: string
  email: string
}
const data: RequestBody = req.body

// ✅ 6. 使用事务
await AppDataSource.transaction(async (manager) => {
  await decrementUserPoints(manager, userId, 100)
  await incrementGamePoints(manager, gameId, 100)
})

// ✅ 7. 哈希密码
user.password_hash = await hashPassword(req.body.password)

// ✅ 8. 添加速率限制
router.post('/api/send-email', 
  rateLimiter({ windowMs: 60000, max: 5 }),
  emailController.send
)

// ✅ 9. 清理资源
const stream = fs.createReadStream(file)
try {
  await processStream(stream)
} finally {
  stream.close()
}

// ✅ 10. 使用环境变量
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 未设置')
}
```

---

## 📋 日常检查清单

提交代码前，请确保：

- [ ] 所有用户输入都经过验证
- [ ] 使用了参数化查询，无 SQL 注入风险
- [ ] 分页参数有边界限制
- [ ] 敏感字段已过滤（如 password_hash）
- [ ] 错误处理不泄露内部信息
- [ ] 关键操作使用了事务
- [ ] 密码已哈希，不存储明文
- [ ] API 有适当的速率限制
- [ ] 文件上传有类型和大小限制
- [ ] 没有硬编码的密钥或密码
- [ ] 资源使用后正确释放
- [ ] 添加了必要的日志
- [ ] 更新了相关测试

---

## 🔗 相关资源

- [完整防御编程指南](./DEFENSIVE_PROGRAMMING_GUIDE.md)
- [实施计划](./DEFENSIVE_IMPLEMENTATION_PLAN.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js 安全最佳实践](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)

---

**保持安全编程习惯，让代码更健壮！** 💪

