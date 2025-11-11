# GameHub 后端 API

GameHub 游戏聚合平台的后端 API 服务，提供用户认证、游戏管理、下载记录、收藏等功能。

## 技术栈

- **Node.js** - 运行时环境
- **TypeScript** - 类型安全的 JavaScript
- **Express** - Web 框架
- **Sequelize** - ORM 数据库操作
- **PostgreSQL** - 主数据库
- **JWT** - 身份验证
- **bcryptjs** - 密码加密
- **nodemailer** - 邮件发送
- **multer** - 文件上传
- **express-validator** - 请求验证
- **express-rate-limit** - 请求限流
- **winston** - 日志记录

## 项目结构

```
backend/
├── src/
│   ├── app.ts              # Express 应用配置
│   ├── index.ts            # 应用入口点
│   ├── config/             # 配置文件
│   │   └── database.ts     # 数据库配置
│   ├── controllers/        # 控制器
│   │   ├── authController.ts
│   │   ├── gameController.ts
│   │   ├── userController.ts
│   │   ├── downloadController.ts
│   │   └── favoriteController.ts
│   ├── middleware/         # 中间件
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── notFoundHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── requestLogger.ts
│   ├── models/             # 数据模型
│   │   ├── User.ts
│   │   ├── Game.ts
│   │   ├── Favorite.ts
│   │   ├── Download.ts
│   │   └── index.ts
│   ├── routes/             # 路由
│   │   ├── auth.ts
│   │   ├── games.ts
│   │   ├── users.ts
│   │   ├── downloads.ts
│   │   ├── favorites.ts
│   │   └── index.ts
│   └── utils/              # 工具函数
│       ├── encryption.ts
│       ├── email.ts
│       ├── fileUpload.ts
│       ├── jwt.ts
│       ├── logger.ts
│       ├── pagination.ts
│       └── validation.ts
├── .env.example            # 环境变量示例
├── package.json            # 项目依赖
└── tsconfig.json           # TypeScript 配置
```

## 安装和运行

### 环境要求

- Node.js v22.7.1 或更高版本
- PostgreSQL 数据库
- npm 或 yarn

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd LittleGameHub/backend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入实际的配置信息：
- 数据库连接信息
- JWT 密钥
- 邮件服务配置
- 其他必要配置

4. 创建数据库
```sql
CREATE DATABASE gamehub;
```

5. 运行项目
```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## API 文档

API 文档将在服务器启动后可通过 `/api-docs` 访问（Swagger UI）。

### 主要端点

#### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新令牌
- `POST /api/auth/verify-email` - 验证邮箱
- `POST /api/auth/forgot-password` - 忘记密码
- `POST /api/auth/reset-password` - 重置密码

#### 游戏相关
- `GET /api/games` - 获取游戏列表
- `GET /api/games/:id` - 获取游戏详情
- `POST /api/games` - 创建游戏（管理员）
- `PUT /api/games/:id` - 更新游戏（管理员）
- `DELETE /api/games/:id` - 删除游戏（管理员）

#### 用户相关
- `GET /api/users` - 获取用户列表（管理员）
- `GET /api/users/:id` - 获取用户详情（管理员）
- `PUT /api/users/:id` - 更新用户信息（管理员）
- `DELETE /api/users/:id` - 删除用户（管理员）

#### 收藏相关
- `GET /api/favorites` - 获取收藏列表（管理员）
- `POST /api/favorites` - 添加收藏
- `DELETE /api/favorites` - 取消收藏

#### 下载相关
- `GET /api/downloads` - 获取下载列表（管理员）
- `POST /api/downloads` - 创建下载记录
- `PUT /api/downloads/:id/progress` - 更新下载进度
- `PATCH /api/downloads/:id/pause` - 暂停下载
- `PATCH /api/downloads/:id/resume` - 恢复下载

## 数据库模型

### PostgreSQL JSONB 功能

本项目使用PostgreSQL的JSONB数据类型来存储游戏元数据，包括平台列表、游戏截图、系统需求和标签等。JSONB提供了以下优势：

- **高效查询**：支持GIN索引，大幅提升JSON数据查询性能
- **灵活结构**：可以存储半结构化数据，适应不同游戏的多样化需求
- **数据完整性**：支持JSON数据验证和约束
- **压缩存储**：JSONB格式比普通JSON更节省存储空间

Game模型提供了以下JSONB查询方法：
- `Game.findByPlatform(platform)` - 查询支持指定平台的游戏
- `Game.findByTag(tag)` - 查询包含指定标签的游戏

### User (用户)
- id: 用户ID
- username: 用户名
- email: 邮箱
- password: 密码（哈希）
- avatar: 头像URL
- role: 角色（user/admin）
- isActive: 是否激活
- isEmailVerified: 邮箱是否验证
- emailVerificationToken: 邮箱验证令牌
- passwordResetToken: 密码重置令牌
- passwordResetExpires: 密码重置过期时间

### Game (游戏)
- id: 游戏ID
- title: 游戏标题
- description: 游戏描述
- coverImage: 封面图片
- screenshots: 游戏截图 (JSONB)
- genre: 游戏类型
- platform: 支持平台 (JSONB)
- developer: 开发者
- publisher: 发行商
- releaseDate: 发布日期
- price: 价格
- isFree: 是否免费
- downloadUrl: 下载链接
- fileSize: 文件大小
- systemRequirements: 系统需求 (JSONB)
- tags: 游戏标签 (JSONB)
- isActive: 是否激活
- isFeatured: 是否精选

注意：标有 (JSONB) 的字段使用PostgreSQL的JSONB数据类型存储，提供了高效的JSON查询能力和索引支持。

### Favorite (收藏)
- id: 收藏ID
- userId: 用户ID
- gameId: 游戏ID
- createdAt: 创建时间

### Download (下载)
- id: 下载ID
- userId: 用户ID
- gameId: 游戏ID
- status: 下载状态（pending/in_progress/paused/completed/cancelled/failed）
- progress: 下载进度（0-100）
- downloadedSize: 已下载大小
- fileSize: 文件总大小
- downloadSpeed: 下载速度
- filePath: 文件路径
- downloadUrl: 下载链接
- startedAt: 开始时间
- completedAt: 完成时间
- errorMessage: 错误信息

## 安全特性

- JWT 身份验证
- 密码哈希加密
- 请求限流
- 输入验证
- CORS 配置
- 安全头设置

## 日志记录

应用使用 Winston 进行日志记录，日志级别包括：
- error: 错误信息
- warn: 警告信息
- info: 一般信息
- debug: 调试信息

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。