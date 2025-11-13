# GameHub Monorepo 重构 - 安全性和代码复用指南

## 🔒 安全性保证

### 1. 代码安全性

#### 1.1 类型安全

```typescript
// ✅ 好的做法：使用强类型
interface ApiResponse<T> {
  data: T;
  error: string | null;
}

async function fetchGames(): Promise<ApiResponse<Game[]>> {
  try {
    const response = await apiClient.get<Game[]>('/games');
    return { data: response, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
}

// ❌ 避免：使用 any 类型
async function fetchGames(): Promise<any> {
  return await apiClient.get('/games');
}
```

#### 1.2 认证和授权

```typescript
// packages/shared/src/api/auth.interceptor.ts
export class AuthInterceptor {
  static setupAuth(client: ApiClient) {
    client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 刷新 token 或重定向到登录
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
}
```

#### 1.3 数据验证

```typescript
// packages/shared/src/utils/validation.ts
export class Validator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    // 至少8个字符，包含大小写字母和数字
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
}

// 使用示例
const email = 'user@example.com';
if (!Validator.validateEmail(email)) {
  throw new Error('Invalid email');
}
```

#### 1.4 错误处理

```typescript
// packages/shared/src/utils/error-handler.ts
export class ErrorHandler {
  static handle(error: any): { message: string; code: string } {
    if (error.response?.status === 401) {
      return { message: '未授权', code: 'UNAUTHORIZED' };
    }

    if (error.response?.status === 403) {
      return { message: '禁止访问', code: 'FORBIDDEN' };
    }

    if (error.response?.status === 404) {
      return { message: '资源不存在', code: 'NOT_FOUND' };
    }

    if (error.response?.status >= 500) {
      return { message: '服务器错误', code: 'SERVER_ERROR' };
    }

    return { message: error.message || '未知错误', code: 'UNKNOWN' };
  }
}
```

### 2. 依赖安全性

#### 2.1 版本锁定

```json
{
  "dependencies": {
    "react": "18.2.0",
    "axios": "1.6.0",
    "zustand": "4.4.0"
  }
}
```

#### 2.2 安全审计

```bash
# 定期检查依赖安全性
pnpm audit

# 修复安全漏洞
pnpm audit --fix
```

### 3. 数据安全性

#### 3.1 敏感数据处理

```typescript
// ✅ 不要在客户端存储敏感数据
// ❌ localStorage.setItem('password', password);

// ✅ 使用 httpOnly cookies 存储 token
// 后端设置：res.cookie('token', token, { httpOnly: true });

// ✅ 使用环境变量
const API_KEY = import.meta.env.VITE_API_KEY;
```

#### 3.2 HTTPS 通信

```typescript
// 确保所有 API 调用使用 HTTPS
const apiClient = new ApiClient({
  baseURL: 'https://api.gamehub.com',
  // ...
});
```

---

## 🔄 代码复用指南

### 1. 共享包结构

```
packages/shared/
├── src/
│   ├── api/              # API 客户端和服务
│   │   ├── client.ts     # 基础 HTTP 客户端
│   │   ├── games.api.ts  # 游戏 API
│   │   ├── auth.api.ts   # 认证 API
│   │   └── index.ts      # 导出
│   │
│   ├── types/            # 类型定义
│   │   ├── game.ts
│   │   ├── user.ts
│   │   └── index.ts
│   │
│   ├── stores/           # 状态管理
│   │   ├── gameStore.ts
│   │   ├── authStore.ts
│   │   └── index.ts
│   │
│   ├── hooks/            # 自定义 Hooks
│   │   ├── useGames.ts
│   │   ├── useAuth.ts
│   │   └── index.ts
│   │
│   ├── utils/            # 工具函数
│   │   ├── image.ts
│   │   ├── cache.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   │
│   └── index.ts          # 主导出
```

### 2. 导出规范

```typescript
// packages/shared/src/index.ts
// API
export { ApiClient, GamesApi, AuthApi } from './api';
export type { ApiConfig } from './api';

// Types
export type { Game, User, Auth, GetGamesParams, PaginatedResponse } from './types';

// Stores
export { useGameStore, useAuthStore } from './stores';
export type { GameState, AuthState } from './stores';

// Hooks
export { useGames, useAuth } from './hooks';

// Utils
export { ImageOptimizer, CacheManager, Validator, ErrorHandler } from './utils';
```

### 3. 在 Web 应用中使用

```typescript
// packages/web/src/pages/GamesPage.tsx
import {
  GamesApi,
  useGameStore,
  useGames,
  type Game,
  ImageOptimizer,
} from '@gamehub/shared';

export function GamesPage() {
  const { games, loading } = useGames();
  const { setGames } = useGameStore();

  return (
    <div>
      {games.map((game) => (
        <div key={game.id}>
          <img
            src={ImageOptimizer.getOptimizedUrl(game.coverImageUrl, 200)}
            alt={game.title}
          />
          <h3>{game.title}</h3>
        </div>
      ))}
    </div>
  );
}
```

### 4. 在移动应用中使用

```typescript
// packages/mobile/src/screens/GamesScreen.tsx
import {
  GamesApi,
  useGameStore,
  useGames,
  type Game,
  ImageOptimizer,
} from '@gamehub/shared';
import { FlatList, View, Image, Text } from 'react-native';

export function GamesScreen() {
  const { games, loading } = useGames();

  return (
    <View>
      <FlatList
        data={games}
        renderItem={({ item }) => (
          <View>
            <Image
              source={{ uri: ImageOptimizer.getOptimizedUrl(item.coverImageUrl, 200) }}
              style={{ width: 200, height: 300 }}
            />
            <Text>{item.title}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}
```

### 5. 代码复用率计算

```typescript
// 计算公式
复用率 = (共享代码行数 / 总代码行数) × 100%

// 示例
共享代码：
- API 层：500 行
- 类型定义：300 行
- 状态管理：400 行
- 工具函数：200 行
总计：1400 行

Web 应用：3000 行
移动应用：3000 行

复用率 = 1400 / (1400 + 3000 + 3000) × 100% = 19%

// 但实际上，共享代码被两个应用使用
实际复用率 = 1400 × 2 / (1400 × 2 + 3000 + 3000) × 100% = 31.8%

// 更准确的计算（考虑代码重复）
Web 独有代码：1500 行
移动独有代码：1500 行
共享代码：1400 行

Web 复用率 = 1400 / (1400 + 1500) × 100% = 48.3%
移动复用率 = 1400 / (1400 + 1500) × 100% = 48.3%
总体复用率 = 1400 / (1400 + 1500 + 1500) × 100% = 31.8%

目标：80%+ 复用率
```

---

## 🛡️ 安全检查清单

### 开发阶段
- [ ] 所有 API 调用使用 HTTPS
- [ ] 敏感数据不存储在 localStorage
- [ ] 使用强类型（避免 any）
- [ ] 实现输入验证
- [ ] 实现错误处理
- [ ] 使用环境变量管理配置

### 代码审查阶段
- [ ] 检查是否有硬编码的密钥
- [ ] 检查是否有 SQL 注入风险
- [ ] 检查是否有 XSS 风险
- [ ] 检查是否有 CSRF 保护
- [ ] 检查依赖安全性

### 部署阶段
- [ ] 运行 `pnpm audit`
- [ ] 更新依赖到最新安全版本
- [ ] 配置 CORS
- [ ] 配置 CSP（Content Security Policy）
- [ ] 启用 HTTPS
- [ ] 配置 httpOnly cookies

---

## 📊 代码复用指标

### 目标指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 共享代码比例 | > 30% | 0% |
| 代码复用率 | > 80% | 0% |
| 重复代码 | < 5% | 待测 |
| 测试覆盖率 | > 85% | 待测 |

### 监控方法

```bash
# 使用 cloc 计算代码行数
npm install -g cloc

# 统计代码行数
cloc packages/

# 使用 jscpd 检测重复代码
npm install -g jscpd
jscpd packages/

# 使用 nyc 计算测试覆盖率
npm install -g nyc
nyc pnpm test
```

---

## 🔐 安全部署清单

### 前端部署
- [ ] 启用 gzip 压缩
- [ ] 配置 CSP 头
- [ ] 启用 HTTPS
- [ ] 配置 CORS
- [ ] 使用 httpOnly cookies
- [ ] 实现 CSRF 保护

### 后端部署
- [ ] 使用环境变量管理敏感信息
- [ ] 启用 HTTPS
- [ ] 配置速率限制
- [ ] 实现请求验证
- [ ] 使用 JWT 认证
- [ ] 实现日志记录

### 数据库部署
- [ ] 使用强密码
- [ ] 启用 SSL 连接
- [ ] 定期备份
- [ ] 实现访问控制
- [ ] 使用加密存储敏感数据

---

## 📈 性能和安全平衡

### 性能优化 vs 安全性

| 优化方案 | 性能提升 | 安全性影响 | 建议 |
|---------|---------|----------|------|
| 缓存 API 响应 | 高 | 低 | ✅ 使用，但要设置合理的 TTL |
| 压缩资源 | 中 | 无 | ✅ 使用 |
| 代码分割 | 中 | 无 | ✅ 使用 |
| 移除类型检查 | 低 | 高 | ❌ 不建议 |
| 禁用 HTTPS | 低 | 极高 | ❌ 不建议 |

---

**下一步：** 按照 `04_STEP_BY_STEP_GUIDE.md` 逐步实施 Monorepo 重构

