# GameHub Monorepo 重构 - 逐步实施指南

## 🎯 核心目标

- ✅ 建立完整的 Monorepo 结构
- ✅ 提取共享代码层
- ✅ 实现 80%+ 代码复用率
- ✅ 保证代码安全性和质量

---

## 📋 第1阶段：准备（第1-2周）

### Step 1: 初始化 Monorepo 结构 ✅

```bash
# 1. 在项目根目录创建 packages 目录
mkdir -p packages/{shared,web,mobile,backend}

# 2. 创建根 package.json
cat > package.json << 'EOF'
{
  "name": "gamehub",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "clean": "pnpm -r run clean && rm -rf node_modules"
  }
}
EOF

# 3. 创建 pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
EOF

# 4. 创建 .npmrc
cat > .npmrc << 'EOF'
shamefully-hoist=true
strict-peer-dependencies=false
EOF
```

### Step 2: 版本控制

```bash
# 创建重构分支
git checkout -b feat/monorepo-refactor

# 创建备份分支
git checkout -b backup/before-refactor
git push origin backup/before-refactor

# 回到重构分支
git checkout feat/monorepo-refactor
```

---

## 📋 第2阶段：共享包创建（第3-4周）

### Step 3: 创建 @gamehub/shared 包

```bash
cd packages/shared

# 创建 package.json
cat > package.json << 'EOF'
{
  "name": "@gamehub/shared",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    "./api": "./src/api/index.ts",
    "./types": "./src/types/index.ts",
    "./stores": "./src/stores/index.ts",
    "./utils": "./src/utils/index.ts"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "zustand": "^4.4.0"
  }
}
EOF

# 创建目录结构
mkdir -p src/{api,types,stores,hooks,utils}
```

### Step 4: 提取 API 层

```typescript
// packages/shared/src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class ApiClient {
  private instance: AxiosInstance;

  constructor(baseURL: string) {
    this.instance = axios.create({ baseURL, timeout: 10000 });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }
}
```

### Step 5: 提取类型定义

```typescript
// packages/shared/src/types/game.ts
export interface Game {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  source: 'rawg' | 'itch' | 'igdb';
  sourceId: string;
  sourceUrl: string;
  genres: string[];
  platforms: string[];
  releaseDate: string;
  rating: number;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetGamesParams {
  page?: number;
  limit?: number;
  search?: string;
  source?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// packages/shared/src/types/user.ts
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  role: 'user' | 'admin';
  pointBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Auth {
  accessToken: string;
  refreshToken: string;
  user: User;
}
```

### Step 6: 提取状态管理

```typescript
// packages/shared/src/stores/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Game } from '../types';

interface GameState {
  games: Game[];
  loading: boolean;
  error: string | null;
  setGames: (games: Game[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      games: [],
      loading: false,
      error: null,
      setGames: (games) => set({ games }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    { name: 'game-store' }
  )
);
```

### Step 7: 验证共享包

```bash
cd packages/shared
pnpm build
ls -la dist/
```

---

## 📋 第3阶段：Web 应用迁移（第5-6周）

### Step 8: 创建 Web 包

```bash
cd packages/web

cat > package.json << 'EOF'
{
  "name": "@gamehub/web",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "@gamehub/shared": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.16.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.1.0",
    "vite": "^5.0.0"
  }
}
EOF

mkdir -p src/{components,pages,stores,services,hooks,styles}
```

### Step 9: 迁移代码

```bash
# 复制现有代码
cp -r ../../frontend/src/components ./src/
cp -r ../../frontend/src/pages ./src/
cp ../../frontend/src/App.tsx ./src/
cp ../../frontend/src/main.tsx ./src/

# 更新导入路径
find ./src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|@/services/api|@gamehub/shared/api|g' {} \;
find ./src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|@/types|@gamehub/shared/types|g' {} \;
find ./src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|@/stores|@gamehub/shared/stores|g' {} \;
```

### Step 10: 测试 Web 应用

```bash
cd packages/web
pnpm install
pnpm dev
# 访问 http://localhost:5173
```

---

## 📋 第4阶段：后端优化（第7-8周）

### Step 11: 优化数据库

```sql
-- 创建索引
CREATE INDEX idx_games_source_rating ON games(source, rating DESC);
CREATE INDEX idx_games_genres ON games USING GIN(genres);
CREATE INDEX idx_games_platforms ON games USING GIN(platforms);
CREATE UNIQUE INDEX idx_games_source_id ON games(source, source_id);
```

### Step 12: 配置 Redis 缓存

```typescript
// packages/backend/src/config/cache.config.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

export const cacheConfig = CacheModule.register({
  isGlobal: true,
  store: redisStore,
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  ttl: 5 * 60,
});
```

---

## 📋 第5阶段：验证和发布（第9-10周）

### Step 13: 完整测试

```bash
# 运行所有测试
pnpm test

# 性能测试
lighthouse http://localhost:5173 --view
```

### Step 14: 发布到生产

```bash
# 构建
pnpm build

# 创建标签
git tag -a v1.0.0-monorepo -m "Monorepo 重构完成"

# 推送
git push origin v1.0.0-monorepo

# 灰度发布（10% 用户）
```

---

## ✅ 检查清单

### 第1-2周
- [ ] 初始化 Monorepo 结构
- [ ] 创建版本控制分支
- [ ] 性能基准测试

### 第3-4周
- [ ] 创建 @gamehub/shared 包
- [ ] 提取 API 层
- [ ] 提取类型定义
- [ ] 提取状态管理

### 第5-6周
- [ ] 创建 Web 包
- [ ] 迁移代码
- [ ] 更新导入路径
- [ ] 测试 Web 应用

### 第7-8周
- [ ] 优化数据库
- [ ] 配置 Redis 缓存
- [ ] 实现异步处理
- [ ] 性能测试

### 第9-10周
- [ ] 完整集成测试
- [ ] 性能验收
- [ ] 文档完善
- [ ] 发布到生产

---

## 🚀 快速启动命令

```bash
# 安装依赖
pnpm install

# 启动所有应用
pnpm dev

# 单独启动
pnpm -F @gamehub/web dev
pnpm -F @gamehub/backend dev

# 构建
pnpm build

# 测试
pnpm test

# 代码检查
pnpm lint
```

