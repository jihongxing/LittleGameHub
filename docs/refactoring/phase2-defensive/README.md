# Phase 2: 防御性编程实施

> **阶段**: Phase 2 of 4  
> **时长**: 3 周  
> **难度**: 🔴🔴🔴🔴 高  
> **状态**: ⏳ 待开始  
> **依赖**: ✅ Phase 1 必须完成

## 📋 目录

- [总览](#总览)
- [目标与成果](#目标与成果)
- [前置条件](#前置条件)
- [实施步骤](#实施步骤)
- [详细文档](#详细文档)
- [验收标准](#验收标准)

---

## 总览

Phase 2 的核心任务是在 Monorepo 架构基础上，实施全面的防御性编程措施，从输入验证、安全增强、错误处理到并发控制，构建一个安全、健壮的系统。

### 为什么在 Monorepo 后做防御性编程？

✅ **优势倍增**:
```typescript
// shared/validation/user.dto.ts - 一次定义
export class RegisterDto {
  @IsEmail()
  email: string
  
  @MinLength(8)
  password: string
}

// backend 使用
import { RegisterDto } from '@gamehub/shared/validation'

// frontend 也使用
import { RegisterDto } from '@gamehub/shared/validation'

// ✅ 前后端验证逻辑完全一致！
```

---

## 目标与成果

### 主要目标

1. **输入验证系统**
   - DTO 验证
   - 分页参数边界检查
   - 文件上传验证

2. **安全增强**
   - JWT 黑名单机制
   - 密码策略增强
   - CSRF 保护
   - Rate Limiting 增强

3. **错误处理优化**
   - 统一错误处理
   - 敏感信息隐藏
   - 重试机制

4. **并发控制**
   - 解决竞态条件
   - 事务保护
   - 分布式锁（可选）

### 关键成果 (KPI)

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| API 输入验证覆盖率 | 100% | 代码审查 |
| 单元测试覆盖率 | >70% | Jest coverage |
| 安全漏洞数量 | 0 | npm audit |
| 错误处理覆盖率 | 100% | 代码审查 |

---

## 前置条件

### 必须完成

- ✅ Phase 1 (Monorepo) 已完成
- ✅ shared 包可以正常使用
- ✅ 所有测试通过

### 环境要求

```bash
# Redis (用于 Token 黑名单和分布式锁)
redis-server --version  # >= 6.0

# PostgreSQL (数据库)
psql --version  # >= 13.0

# 安装新依赖
pnpm add -w class-validator class-transformer
pnpm add -w isomorphic-dompurify
pnpm add -w zxcvbn
pnpm add -w csurf
pnpm add -w redlock
```

---

## 实施步骤

### Week 3: 输入验证 + JWT 安全

#### Day 1-2: DTO 验证系统

**目标**: 建立基于 class-validator 的验证系统

**任务**:
- [ ] 在 shared 包创建 validation 目录
- [ ] 创建验证中间件
- [ ] 为 Auth 模块创建 DTO
- [ ] 为 Game 模块创建 DTO
- [ ] 在后端应用验证
- [ ] 在前端复用验证

**详细文档**: 📖 [01-input-validation.md](./01-input-validation.md)

**预计时间**: 12-16 小时

---

#### Day 3-4: JWT 黑名单 + 密码策略

**目标**: 实现 JWT Token 撤销和强密码策略

**任务**:
- [ ] 在 shared/utils 创建 token-blacklist.ts
- [ ] 实现 Token 黑名单服务
- [ ] 更新认证中间件
- [ ] 实现登出功能
- [ ] 创建密码强度检查
- [ ] 更新注册和修改密码逻辑

**详细文档**: 📖 [02-security-enhancement.md](./02-security-enhancement.md)

**预计时间**: 12-16 小时

---

#### Day 5: 错误处理优化

**目标**: 统一错误处理，隐藏敏感信息

**任务**:
- [ ] 重构 errorHandler 中间件
- [ ] 实现错误分类
- [ ] 隐藏生产环境详情
- [ ] 实现重试机制
- [ ] 添加错误日志

**详细文档**: 📖 [03-error-handling.md](./03-error-handling.md)

**预计时间**: 6-8 小时

---

### Week 4: 安全防护 + 并发控制

#### Day 1-2: CSRF + Rate Limiting

**目标**: 添加 CSRF 保护和高级限流

**任务**:
- [ ] 配置 csurf 中间件
- [ ] 创建 CSRF Token 端点
- [ ] 前端集成 CSRF Token
- [ ] 实现用户级 Rate Limiting
- [ ] 实现暴力破解防护
- [ ] 昂贵操作限流

**详细文档**: 📖 [02-security-enhancement.md](./02-security-enhancement.md) (Section 2)

**预计时间**: 12-16 小时

---

#### Day 3-4: 并发控制 + 事务

**目标**: 解决竞态条件，保证数据一致性

**任务**:
- [ ] 解决用户注册竞态
- [ ] 为收藏操作添加事务
- [ ] 为积分交易添加事务
- [ ] 实现分布式锁（可选）
- [ ] 测试并发场景

**详细文档**: 📖 [04-concurrency-control.md](./04-concurrency-control.md)

**预计时间**: 12-16 小时

---

#### Day 5: 审计日志系统

**目标**: 建立完整的审计日志

**任务**:
- [ ] 创建 AuditLog 实体
- [ ] 实现审计日志服务
- [ ] 为敏感操作添加日志
- [ ] 实现日志查询接口
- [ ] 测试审计功能

**详细文档**: 📖 [03-error-handling.md](./03-error-handling.md) (Section 2)

**预计时间**: 6-8 小时

---

### Week 5: 完善 + 测试

#### Day 1-2: 文件上传安全

**目标**: 完善文件上传验证

**任务**:
- [ ] 配置 Multer 安全过滤
- [ ] MIME 类型验证
- [ ] 文件大小限制
- [ ] 文件名安全处理
- [ ] 测试上传功能

**详细文档**: 📖 [01-input-validation.md](./01-input-validation.md) (Section 2)

**预计时间**: 10-12 小时

---

#### Day 3-4: 单元测试

**目标**: 为核心功能编写测试

**任务**:
- [ ] 测试 DTO 验证
- [ ] 测试 JWT 黑名单
- [ ] 测试密码策略
- [ ] 测试错误处理
- [ ] 测试并发控制

**详细文档**: 📖 Testing Guide (TBD)

**预计时间**: 12-16 小时

---

#### Day 5: 集成测试 + 文档

**目标**: 集成测试和文档完善

**任务**:
- [ ] API 集成测试
- [ ] 安全测试
- [ ] 更新 API 文档
- [ ] 更新开发文档
- [ ] 填写检查清单

**预计时间**: 6-8 小时

---

## 详细文档

### 核心文档

1. **[输入验证实施](./01-input-validation.md)**
   - DTO 验证系统
   - 分页参数验证
   - 文件上传验证
   - 前后端验证复用

2. **[安全增强实施](./02-security-enhancement.md)**
   - JWT 黑名单机制
   - 密码策略增强
   - CSRF 保护
   - Rate Limiting

3. **[错误处理实施](./03-error-handling.md)**
   - 错误分类和处理
   - 敏感信息隐藏
   - 重试机制
   - 审计日志系统

4. **[并发控制实施](./04-concurrency-control.md)**
   - 竞态条件解决
   - 事务保护
   - 分布式锁
   - 并发测试

### 参考文档

- **[检查清单](./checklist.md)** - Phase 2 完成检查清单
- **[代码模板](../templates/code-templates.md)** - 常用代码模板
- **[防御编程指南](../../safefile/DEFENSIVE_PROGRAMMING_GUIDE.md)** - 完整指南
- **[快速参考](../../safefile/DEFENSIVE_QUICK_REFERENCE.md)** - 速查表

---

## 验收标准

### 功能完整性

- ✅ **所有 API 有输入验证**
  ```bash
  # 测试无效输入
  curl -X POST /api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email": "invalid", "password": "123"}'
  # 应返回 400 错误和详细验证信息
  ```

- ✅ **JWT Token 可以撤销**
  ```bash
  # 登出后，使用旧 Token 应失败
  curl -X GET /api/auth/me \
    -H "Authorization: Bearer <old-token>"
  # 应返回 401 错误
  ```

- ✅ **密码策略生效**
  ```bash
  # 弱密码应被拒绝
  curl -X POST /api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "123456"}'
  # 应返回密码强度不足错误
  ```

- ✅ **CSRF 保护工作**
  ```bash
  # 无 CSRF Token 应失败
  curl -X POST /api/games \
    -H "Content-Type: application/json" \
    -d '{"title": "Test"}'
  # 应返回 403 错误
  ```

### 安全性检查

- ✅ **无高危漏洞**
  ```bash
  pnpm audit --audit-level=high
  # 应该 0 vulnerabilities
  ```

- ✅ **错误信息不泄露**
  ```bash
  # 生产环境应返回通用错误
  NODE_ENV=production pnpm start
  # 数据库错误应返回 "服务器内部错误"
  ```

### 测试覆盖率

- ✅ **单元测试覆盖率 > 70%**
  ```bash
  pnpm test:coverage
  # Statements: >70%
  # Branches: >65%
  # Functions: >70%
  # Lines: >70%
  ```

---

## 代码示例

### DTO 验证示例

```typescript
// packages/shared/src/validation/auth/register.dto.ts
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator'
import { Transform } from 'class-transformer'
import DOMPurify from 'isomorphic-dompurify'

export class RegisterDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @MinLength(3, { message: '用户名至少 3 个字符' })
  @MaxLength(20, { message: '用户名最多 20 个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: '用户名只能包含字母、数字和下划线' 
  })
  @Transform(({ value }) => DOMPurify.sanitize(value?.trim()))
  username: string

  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(100)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string

  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(8, { message: '密码至少 8 个字符' })
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    { message: '密码必须包含大小写字母、数字和特殊字符' }
  )
  password: string
}
```

### 使用方式

```typescript
// packages/backend/src/routes/auth.routes.ts
import { validateDto } from '@gamehub/shared/validation/middleware'
import { RegisterDto } from '@gamehub/shared/validation/auth'

router.post('/register', 
  validateDto(RegisterDto),
  authController.register
)

// packages/frontend-web/src/hooks/useRegister.ts
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'
import { RegisterDto } from '@gamehub/shared/validation/auth'

async function validateForm(data: any) {
  const dto = plainToClass(RegisterDto, data)
  const errors = await validate(dto)
  return errors
}
```

---

## 风险与应对

### 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Redis 故障 | 🟢 低 | 🔴 高 | Fallback 机制 + 监控 |
| 性能下降 | 🟡 中 | 🟡 中 | 性能测试 + 优化 |
| 兼容性问题 | 🟡 中 | 🟡 中 | 充分测试 + 灰度发布 |
| 学习曲线 | 🔴 高 | 🟢 低 | 文档 + 培训 |

### 应对策略

**Redis 故障应对**:
```typescript
// 降级策略
if (!redisClient.isReady) {
  // 使用内存黑名单（临时）
  logger.warn('Redis unavailable, using in-memory blacklist')
  return inMemoryBlacklist.isBlacklisted(token)
}
```

---

## 进度跟踪

### Week 3 检查点

- [ ] DTO 验证系统完成
- [ ] JWT 黑名单实现
- [ ] 密码策略增强
- [ ] 错误处理优化

### Week 4 检查点

- [ ] CSRF 保护实施
- [ ] Rate Limiting 增强
- [ ] 并发控制完成
- [ ] 审计日志系统

### Week 5 检查点

- [ ] 文件上传安全
- [ ] 单元测试覆盖率 >70%
- [ ] 集成测试通过
- [ ] 文档完善

---

## 下一步

Phase 2 完成后，继续执行：

👉 **[Phase 3: 多平台登录](../phase3-auth/README.md)**

---

## 资源链接

- [class-validator 文档](https://github.com/typestack/class-validator)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js 安全最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [防御编程完整指南](../../safefile/DEFENSIVE_PROGRAMMING_GUIDE.md)

---

**准备好了吗？让我们开始！** 👉 [输入验证实施](./01-input-validation.md)

