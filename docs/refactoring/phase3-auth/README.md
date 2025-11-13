# Phase 3: 多平台登录开发

> **阶段**: Phase 3 of 4  
> **时长**: 4 周  
> **难度**: 🔴🔴🔴🔴 高  
> **状态**: ⏳ 待开始  
> **依赖**: ✅ Phase 2 核心部分必须完成

## 📋 目录

- [总览](#总览)
- [目标与成果](#目标与成果)
- [前置条件](#前置条件)
- [实施步骤](#实施步骤)
- [详细文档](#详细文档)
- [验收标准](#验收标准)

---

## 总览

Phase 3 的核心任务是基于已建立的安全基础设施和 Monorepo 架构，实现微信、GitHub、Google 等第三方平台的统一登录功能。

### 为什么这个顺序最合理？

✅ **复用 Phase 1 的架构优势**:
```typescript
// shared/auth/oauth-provider.ts - 抽象层，所有平台共用
export abstract class OAuthProvider {
  abstract getAuthUrl(): string
  abstract handleCallback(code: string): Promise<OAuthUser>
}

// backend, frontend-web, mobile 都复用
import { WeChatProvider } from '@gamehub/shared/auth'
```

✅ **利用 Phase 2 的安全措施**:
```typescript
// 复用 Phase 2 的 JWT 黑名单
import { tokenBlacklistService } from '@gamehub/shared/security'

// 复用 Phase 2 的审计日志
import { auditLogService } from '@gamehub/shared/logging'

// 复用 Phase 2 的 Rate Limiting
import { bruteForceProtection } from '@gamehub/shared/middleware'
```

---

## 目标与成果

### 主要目标

1. **OAuth 抽象层**
   - 统一的 OAuth 接口
   - 可扩展的提供商架构
   - 错误处理和重试

2. **平台集成**
   - 微信登录（Web + 移动）
   - GitHub 登录
   - Google 登录

3. **账号管理**
   - 账号绑定/解绑
   - 多账号合并
   - 用户信息同步

4. **前端体验**
   - 三端统一 UI
   - 登录状态管理
   - Token 自动刷新

### 关键成果 (KPI)

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 登录成功率 | >99% | 日志统计 |
| 平均登录时间 | <3秒 | 性能监控 |
| 用户满意度 | >4.5/5 | 用户反馈 |
| 第三方登录占比 | >60% | 注册来源分析 |

---

## 前置条件

### 必须完成

- ✅ Phase 1 (Monorepo) 已完成
- ✅ Phase 2 核心安全措施已完成
  - DTO 验证
  - JWT 黑名单
  - CSRF 保护
  - 审计日志

### 平台申请

需要提前申请以下平台的开发者账号和 OAuth 应用：

#### 微信开放平台
- [ ] 注册开发者账号
- [ ] 创建网站应用
- [ ] 获取 AppID 和 AppSecret
- [ ] 配置回调域名
- 📖 [官方文档](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)

#### GitHub OAuth Apps
- [ ] 在 GitHub Settings 创建 OAuth App
- [ ] 获取 Client ID 和 Client Secret
- [ ] 配置回调 URL
- 📖 [官方文档](https://docs.github.com/en/developers/apps/building-oauth-apps)

#### Google Cloud Platform
- [ ] 创建 Google Cloud 项目
- [ ] 启用 Google+ API
- [ ] 创建 OAuth 2.0 凭据
- [ ] 配置授权重定向 URI
- 📖 [官方文档](https://developers.google.com/identity/protocols/oauth2)

### 环境配置

```bash
# .env 添加配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_CALLBACK_URL=http://localhost:8000/api/auth/wechat/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/github/callback

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback
```

---

## 实施步骤

### Week 6: OAuth 基础 + 数据库

#### Day 1-2: OAuth 抽象层

**目标**: 设计并实现统一的 OAuth 抽象层

**任务**:
- [ ] 设计 OAuth 接口
- [ ] 创建基类 OAuthProvider
- [ ] 实现 State 参数生成和验证
- [ ] 实现错误处理
- [ ] 编写单元测试

**详细文档**: 📖 [01-oauth-abstraction.md](./01-oauth-abstraction.md)

**预计时间**: 12-16 小时

---

#### Day 3-4: 数据库 Schema

**目标**: 设计账号关联的数据库结构

**任务**:
- [ ] 创建 UserAuthMethod 实体
- [ ] 更新 User 实体
- [ ] 创建数据库迁移
- [ ] 编写 Repository 方法
- [ ] 测试数据库操作

**数据库设计**:
```sql
CREATE TABLE user_auth_methods (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  auth_provider VARCHAR(50) NOT NULL, -- 'wechat', 'github', 'google'
  auth_provider_id VARCHAR(255) NOT NULL, -- 第三方平台的用户ID
  email VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(auth_provider, auth_provider_id)
);

CREATE INDEX idx_user_auth_methods_user_id ON user_auth_methods(user_id);
CREATE INDEX idx_user_auth_methods_provider ON user_auth_methods(auth_provider, auth_provider_id);
```

**预计时间**: 12-16 小时

---

#### Day 5: 基础 UI 组件

**目标**: 创建登录页面的基础组件

**任务**:
- [ ] 设计登录页面 UI
- [ ] 创建第三方登录按钮组件
- [ ] 创建账号绑定页面
- [ ] 响应式设计
- [ ] 单元测试

**预计时间**: 6-8 小时

---

### Week 7: 微信登录集成

#### Day 1-2: 微信登录后端

**目标**: 实现微信登录的服务端逻辑

**任务**:
- [ ] 实现 WeChatProvider
- [ ] 创建授权 URL 生成
- [ ] 实现回调处理
- [ ] 用户信息获取
- [ ] 账号创建/绑定逻辑
- [ ] 错误处理

**详细文档**: 📖 [02-wechat-integration.md](./02-wechat-integration.md)

**预计时间**: 12-16 小时

---

#### Day 3-4: 微信登录前端

**目标**: 实现微信登录的前端流程

**任务**:
- [ ] 创建微信登录按钮
- [ ] 实现登录跳转
- [ ] 处理回调
- [ ] Token 存储
- [ ] 登录状态管理
- [ ] 错误提示

**预计时间**: 12-16 小时

---

#### Day 5: 测试和调试

**目标**: 全面测试微信登录功能

**任务**:
- [ ] 单元测试
- [ ] 集成测试
- [ ] E2E 测试
- [ ] 错误场景测试
- [ ] 性能测试

**预计时间**: 6-8 小时

---

### Week 8: GitHub + Google 登录

#### Day 1-2: GitHub 登录

**目标**: 实现 GitHub 登录功能

**任务**:
- [ ] 实现 GitHubProvider
- [ ] 后端路由和控制器
- [ ] 前端集成
- [ ] 测试

**详细文档**: 📖 [03-github-integration.md](./03-github-integration.md)

**预计时间**: 12-16 小时

---

#### Day 3-4: Google 登录

**目标**: 实现 Google 登录功能

**任务**:
- [ ] 实现 GoogleProvider
- [ ] 后端路由和控制器
- [ ] 前端集成
- [ ] 测试

**详细文档**: 📖 [04-google-integration.md](./04-google-integration.md)

**预计时间**: 12-16 小时

---

#### Day 5: 账号绑定逻辑

**目标**: 实现账号绑定和解绑

**任务**:
- [ ] 绑定接口
- [ ] 解绑接口
- [ ] 账号合并逻辑
- [ ] 前端绑定页面
- [ ] 测试

**预计时间**: 6-8 小时

---

### Week 9: 三端适配 + 上线

#### Day 1-2: 移动端适配

**目标**: 适配移动端登录

**任务**:
- [ ] 移动端 UI 适配
- [ ] 微信 App 登录
- [ ] 测试移动端登录
- [ ] 优化用户体验

**预计时间**: 12-16 小时

---

#### Day 3-4: 集成测试

**目标**: 全面的集成测试

**任务**:
- [ ] 登录流程测试
- [ ] 账号绑定测试
- [ ] 三端一致性测试
- [ ] 性能测试
- [ ] 安全测试

**预计时间**: 12-16 小时

---

#### Day 5: 文档和上线准备

**目标**: 文档完善和上线准备

**任务**:
- [ ] 更新 API 文档
- [ ] 用户文档
- [ ] 部署文档
- [ ] 监控配置
- [ ] 灰度发布准备

**预计时间**: 6-8 小时

---

## 详细文档

### 核心文档

1. **[OAuth 抽象层](./01-oauth-abstraction.md)**
   - OAuth 2.0 基础
   - 抽象层设计
   - State 参数处理
   - 错误处理和重试

2. **[微信登录集成](./02-wechat-integration.md)**
   - 微信 OAuth 流程
   - 后端实现
   - 前端实现
   - 常见问题

3. **[GitHub 登录集成](./03-github-integration.md)**
   - GitHub OAuth 流程
   - 实现步骤
   - 测试方法

4. **[Google 登录集成](./04-google-integration.md)**
   - Google OAuth 流程
   - 实现步骤
   - 测试方法

### 参考文档

- **[检查清单](./checklist.md)** - Phase 3 完成检查清单
- **[多平台登录完整指南](../../thirdlogin/IMPLEMENTATION_GUIDE_MULTI_PLATFORM.md)**
- **[快速开始](../../thirdlogin/QUICK_START_MULTI_PLATFORM.md)**

---

## 验收标准

### 功能完整性

✅ **三个平台登录正常**
```bash
# 测试微信登录
curl http://localhost:8000/api/auth/wechat
# 应返回授权 URL

# 测试 GitHub 登录
curl http://localhost:8000/api/auth/github
# 应返回授权 URL

# 测试 Google 登录
curl http://localhost:8000/api/auth/google
# 应返回授权 URL
```

✅ **账号绑定功能正常**
```bash
# 绑定 GitHub 账号
curl -X POST http://localhost:8000/api/auth/bind/github \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"code": "<github-code>"}'
# 应返回成功
```

✅ **三端体验一致**
- Web 端可以登录
- 移动端可以登录
- 管理后台可以登录

### 性能指标

✅ **登录成功率 >99%**
```bash
# 监控日志
grep "oauth:success" logs/auth.log | wc -l
grep "oauth:fail" logs/auth.log | wc -l
# 成功率应 >99%
```

✅ **登录时间 <3秒**
```bash
# 性能监控
# 从点击登录按钮到完成登录
# P95 < 3 seconds
```

### 安全性

✅ **CSRF 防护有效**
- State 参数正确生成和验证
- 无 State 参数应拒绝

✅ **Token 安全存储**
- Access Token 加密存储
- Refresh Token 安全存储

---

## 代码示例

### OAuth 抽象层

```typescript
// packages/shared/src/auth/oauth-provider.ts
export interface OAuthUser {
  id: string
  email?: string
  name: string
  avatar?: string
}

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  callbackUrl: string
  scope?: string[]
}

export abstract class OAuthProvider {
  constructor(protected config: OAuthConfig) {}

  abstract get name(): string

  abstract getAuthUrl(state: string): string

  abstract handleCallback(
    code: string,
    state: string
  ): Promise<OAuthUser>

  protected generateState(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  protected async verifyState(state: string): Promise<boolean> {
    // 从 Redis 验证 state
    const stored = await redis.get(`oauth:state:${state}`)
    await redis.del(`oauth:state:${state}`)
    return stored !== null
  }
}
```

### 微信登录实现

```typescript
// packages/shared/src/auth/providers/wechat.provider.ts
export class WeChatProvider extends OAuthProvider {
  get name() {
    return 'wechat'
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      appid: this.config.clientId,
      redirect_uri: this.config.callbackUrl,
      response_type: 'code',
      scope: 'snsapi_login',
      state
    })
    return `https://open.weixin.qq.com/connect/qrconnect?${params}#wechat_redirect`
  }

  async handleCallback(code: string, state: string): Promise<OAuthUser> {
    // 验证 state
    const isValid = await this.verifyState(state)
    if (!isValid) {
      throw new Error('Invalid state parameter')
    }

    // 获取 access_token
    const tokenResponse = await axios.get(
      'https://api.weixin.qq.com/sns/oauth2/access_token',
      {
        params: {
          appid: this.config.clientId,
          secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code'
        }
      }
    )

    const { access_token, openid } = tokenResponse.data

    // 获取用户信息
    const userResponse = await axios.get(
      'https://api.weixin.qq.com/sns/userinfo',
      {
        params: {
          access_token,
          openid
        }
      }
    )

    return {
      id: userResponse.data.openid,
      name: userResponse.data.nickname,
      avatar: userResponse.data.headimgurl
    }
  }
}
```

---

## 风险与应对

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 第三方 API 不稳定 | 🟡 中 | 🔴 高 | 重试机制 + 降级方案 |
| 回调域名配置错误 | 🟡 中 | 🔴 高 | 充分测试 + 文档 |
| Token 泄露 | 🟢 低 | 🔴 高 | 加密存储 + 定期刷新 |
| 用户体验不一致 | 🟡 中 | 🟡 中 | 统一设计 + 测试 |

---

## 下一步

Phase 3 完成后，继续执行：

👉 **[Phase 4: 性能优化](../phase4-performance/README.md)**

---

**准备好了吗？让我们开始！** 👉 [OAuth 抽象层](./01-oauth-abstraction.md)

