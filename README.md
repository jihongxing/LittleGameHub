# LittleGameHub Monorepo

LittleGameHub 小游戏聚合平台 - 基于 pnpm workspace 和 Turborepo 的 Monorepo 架构。

## 📦 项目结构

```
LittleGameHub/
├── packages/
│   ├── backend/          # 后端服务 (Express + TypeORM)
│   ├── frontend/         # 前端应用 (React + Vite)
│   └── shared/           # 共享代码 (类型定义、常量、工具函数)
├── docs/                 # 项目文档
├── package.json          # 根目录配置
├── pnpm-workspace.yaml   # pnpm workspace 配置
├── turbo.json            # Turborepo 配置
└── .prettierrc           # 代码格式化配置
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 同时启动所有服务
pnpm dev

# 仅启动后端
pnpm dev:backend

# 仅启动前端
pnpm dev:frontend
```

### 构建

```bash
# 构建所有包
pnpm build

# 构建后端
pnpm build:backend

# 构建前端
pnpm build:frontend
```

### 测试

```bash
# 运行所有测试
pnpm test

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 自动修复代码问题
pnpm lint:fix
```

### 代码格式化

```bash
# 格式化所有代码
pnpm format
```

## 📋 可用脚本

- `pnpm dev` - 启动所有服务（开发模式）
- `pnpm build` - 构建所有包
- `pnpm test` - 运行所有测试
- `pnpm lint` - 检查代码质量
- `pnpm lint:fix` - 自动修复代码问题
- `pnpm type-check` - TypeScript 类型检查
- `pnpm format` - 格式化代码
- `pnpm clean` - 清理所有构建产物

## 📦 Packages

### @littlegamehub/backend

后端 API 服务，提供游戏数据、用户管理、会员系统等功能。

- **技术栈**: Express.js, TypeORM, PostgreSQL, Redis
- **端口**: 8000
- **文档**: [packages/backend/README.md](packages/backend/README.md)

### @littlegamehub/frontend

前端 Web 应用，提供游戏浏览、搜索、用户中心等功能。

- **技术栈**: React, Vite, Ant Design, React Router
- **端口**: 5173
- **文档**: [packages/frontend/README.md](packages/frontend/README.md)

### @littlegamehub/shared

共享代码包，包含类型定义、常量和工具函数。

- **用途**: 在前后端之间共享代码
- **文档**: [packages/shared/README.md](packages/shared/README.md)

## 🛠️ 技术栈

- **Monorepo 管理**: pnpm workspace + Turborepo
- **后端**: Express.js + TypeORM + PostgreSQL + Redis
- **前端**: React + Vite + Ant Design
- **语言**: TypeScript
- **代码质量**: ESLint + Prettier
- **测试**: Jest (backend) + Vitest (frontend)

## 📖 文档

- [实施指南](docs/refactoring/MASTER_IMPLEMENTATION_GUIDE.md)
- [Phase 1: Monorepo 搭建](docs/refactoring/phase1-monorepo/README.md)
- [Phase 2: 防御性编程](docs/refactoring/phase2-defensive/README.md)
- [Phase 3: 多平台登录](docs/refactoring/phase3-auth/README.md)
- [Phase 4: 性能优化](docs/refactoring/phase4-performance/README.md)

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

ISC

## 👥 团队

LittleGameHub 开发团队

---

**注意**: 本项目正在进行重大重构，包括 Monorepo 架构调整、防御性编程实践和多平台登录功能。详细信息请查看 [实施指南](docs/refactoring/MASTER_IMPLEMENTATION_GUIDE.md)。
