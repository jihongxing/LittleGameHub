# GameHub 环境配置指南

## ✅ 已完成的工作

### 1. 环境文件结构

```
LittleGameHub/
├── .env                          ← 唯一的环境配置文件（根目录）
├── .env.example                  ← 示例配置文件
├── .gitignore                    ← 包含 .env
└── packages/
    ├── backend/
    │   ├── src/
    │   │   ├── main.ts           ✅ 已修改
    │   │   ├── app.ts            ✅ 已修改
    │   │   └── config/
    │   │       └── env.ts        ✅ 已修改
    │   └── .env                  ❌ 已删除
    └── frontend/
        └── .env                  ❌ 已删除（如果存在）
```

### 2. 修改的文件

#### 📝 `packages/backend/src/main.ts`

**修改内容**：在最顶部添加 dotenv 加载
```typescript
import 'reflect-metadata'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from root directory FIRST
// 首先从根目录加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { NestFactory } from '@nestjs/core'
// ... 其他导入
```

**作用**：确保在应用启动时首先加载根目录的 `.env` 文件

---

#### 📝 `packages/backend/src/app.ts`

**修改内容**：更新 dotenv 配置路径
```typescript
// 从根目录加载环境变量
// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
```

**作用**：确保 Express 应用也能正确加载根目录的 `.env` 文件

---

#### 📝 `packages/backend/src/config/env.ts`

**修改内容**：更新 dotenv 配置路径
```typescript
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root directory
// 从根目录加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
```

**作用**：确保环境配置模块能正确加载根目录的 `.env` 文件

---

### 3. 路径解析说明

| 文件位置 | 相对路径 | 说明 |
|---------|--------|------|
| `main.ts` | `../../.env` | 从 `src/` 上升2级到根目录 |
| `app.ts` | `../../.env` | 从 `src/` 上升2级到根目录 |
| `config/env.ts` | `../../../.env` | 从 `src/config/` 上升3级到根目录 |

---

## 🔧 根目录 `.env` 文件配置

你的根目录 `.env` 文件应该包含以下内容：

```bash
# ============================================
# 应用配置
# ============================================
NODE_ENV=development
PORT=8000
API_PREFIX=/api
APP_NAME=GameHub

# ============================================
# 数据库配置
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gamehub
DB_USER=postgres
DB_PASSWORD=5625709
DB_SSL=false

# ============================================
# Redis 配置
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# ============================================
# JWT 配置
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# CORS 配置
# ============================================
CORS_ORIGIN=http://localhost:5173

# ============================================
# API 密钥配置（游戏聚合）
# ============================================
RAWG_API_KEY=ca78aa8fd3a542068ee73764f5879631
ITCH_API_KEY=2nlnlpMzPERDH8JaXG4OQwK9Y1Wi0r2rIKZUN0vU
IGDB_CLIENT_ID=your_igdb_client_id
IGDB_ACCESS_TOKEN=your_igdb_access_token

# ============================================
# 小游戏平台配置
# ============================================
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
DOUYIN_CLIENT_KEY=your_douyin_client_key
DOUYIN_CLIENT_SECRET=your_douyin_client_secret

# ============================================
# 游戏聚合配置
# ============================================
AGGREGATION_LIMIT=5000
SYNC_INTERVAL=24
MIN_RATING=2

# ============================================
# 前端配置
# ============================================
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_APP_NAME=GameHub
VITE_PORT=5173
```

---

## ✅ 验证配置

### 方法1：检查文件是否存在

```bash
# 检查根目录 .env 文件
ls -la d:\codeSpace\LittleGameHub\.env

# 确认后端 .env 已删除
ls -la d:\codeSpace\LittleGameHub\packages\backend\.env  # 应该不存在
```

### 方法2：启动后端并检查日志

```bash
cd packages/backend
npm run start

# 应该看到类似的输出：
# 🚀 GameHub API Server is running on port 8000
# 🌍 Environment: development
# 📍 API Endpoint: http://localhost:8000/api
```

### 方法3：检查环境变量是否加载

在后端代码中添加调试日志：

```typescript
import { env } from './config/env'

console.log('Loaded environment:')
console.log('PORT:', env.PORT)
console.log('DB_HOST:', env.DB_HOST)
console.log('RAWG_API_KEY:', env.RAWG_API_KEY ? '✅ Loaded' : '❌ Not loaded')
```

---

## 🚀 下一步

1. ✅ 确保根目录 `.env` 文件已正确配置
2. ✅ 确认后端 `.env` 已删除
3. ✅ 启动后端服务器测试
4. ⏳ 创建 Game 实体
5. ⏳ 创建 GameRepository
6. ⏳ 创建 Game 模块

---

## 📝 常见问题

### Q: 为什么要从根目录加载 `.env`？

A: 在 Monorepo 结构中，统一从根目录加载环境变量可以：
- 避免配置冲突
- 简化配置管理
- 便于团队协作
- 减少出错概率

### Q: 如果后端和前端需要不同的配置怎么办？

A: 可以在根目录 `.env` 中使用不同的前缀：
```bash
# 后端配置
BACKEND_PORT=8000
BACKEND_DATABASE_URL=...

# 前端配置
FRONTEND_PORT=5173
FRONTEND_API_URL=http://localhost:8000/api
```

然后在各自的配置文件中读取对应的变量。

### Q: 如何在生产环境中使用不同的 `.env`？

A: 创建 `.env.production` 文件，然后在启动时指定：
```bash
NODE_ENV=production dotenv -e .env.production npm run start
```

---

## ✨ 总结

✅ 后端已配置为从根目录加载 `.env` 文件
✅ 所有 dotenv 配置路径已更新
✅ 环境变量加载顺序已优化
✅ 准备好进行下一步开发

现在你可以继续创建 Game 实体了！
