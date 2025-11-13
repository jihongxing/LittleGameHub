# Monorepo 搭建指南

> **所属阶段**: Phase 1 - Week 1  
> **预计时间**: 1-2 天  
> **难度**: 🔴🔴🔴 中高

## 📋 目录

- [前言](#前言)
- [Step 1: 环境准备](#step-1-环境准备)
- [Step 2: 初始化 Monorepo](#step-2-初始化-monorepo)
- [Step 3: 配置 pnpm Workspace](#step-3-配置-pnpm-workspace)
- [Step 4: 配置 Turborepo](#step-4-配置-turborepo)
- [Step 5: TypeScript 配置](#step-5-typescript-配置)
- [Step 6: 创建 shared 包](#step-6-创建-shared-包)
- [验证](#验证)

---

## 前言

本指南将引导你从零开始搭建 Monorepo 结构。完成后，你将拥有一个基于 pnpm workspace 和 Turborepo 的现代化 Monorepo 架构。

---

## Step 1: 环境准备

### 1.1 检查工具版本

```bash
# Node.js 版本
node --version
# 输出应该 >= v18.0.0

# pnpm 版本
pnpm --version
# 输出应该 >= 8.0.0

# 如果 pnpm 没有安装或版本过低
npm install -g pnpm@latest
```

### 1.2 创建备份

```bash
# 切换到项目根目录
cd /d/codeSpace/LittleGameHub

# 确保没有未提交的更改
git status

# 创建备份标签
git tag backup/before-monorepo-$(date +%Y%m%d)
git push origin --tags

# 创建工作分支
git checkout -b feature/monorepo-migration
```

### 1.3 备份当前结构

```bash
# 创建备份目录（可选）
mkdir -p ../LittleGameHub-backup
cp -r . ../LittleGameHub-backup/
```

---

## Step 2: 初始化 Monorepo

### 2.1 创建目录结构

```bash
# 在项目根目录执行
mkdir -p packages
mkdir -p scripts
mkdir -p configs
```

### 2.2 初始化根 package.json

```bash
# 如果根目录没有 package.json
pnpm init
```

编辑根目录的 `package.json`:

```json
{
  "name": "littlegamehub-monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "LittleGameHub Monorepo",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\""
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "typescript": "^5.3.3",
    "prettier": "^3.1.0",
    "@types/node": "^20.10.0"
  },
  "packageManager": "pnpm@8.12.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### 2.3 安装根依赖

```bash
pnpm install
```

---

## Step 3: 配置 pnpm Workspace

### 3.1 创建 pnpm-workspace.yaml

在项目根目录创建 `pnpm-workspace.yaml`:

```yaml
packages:
  # 所有 packages 下的包
  - 'packages/*'
  # 排除测试和示例
  - '!**/test/**'
  - '!**/examples/**'
```

### 3.2 配置 .npmrc

在项目根目录创建 `.npmrc`:

```ini
# Hoisting 配置
shamefully-hoist=true
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*

# 严格的 peer dependencies
strict-peer-dependencies=false

# 锁定文件
lockfile=true

# 安装配置
auto-install-peers=true
```

### 3.3 测试 workspace

```bash
# 查看 workspace
pnpm list --depth 0

# 应该显示 root workspace
```

---

## Step 4: 配置 Turborepo

### 4.1 安装 Turborepo

```bash
pnpm add -Dw turbo
```

### 4.2 创建 turbo.json

在项目根目录创建 `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"],
      "env": ["NODE_ENV"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 4.3 配置说明

```javascript
// pipeline 解释
{
  "build": {
    "dependsOn": ["^build"],  // 先构建依赖的包
    "outputs": ["dist/**"],   // 输出目录，用于缓存
    "env": ["NODE_ENV"]       // 影响构建的环境变量
  },
  "dev": {
    "cache": false,           // 开发模式不缓存
    "persistent": true        // 长期运行的任务
  }
}
```

---

## Step 5: TypeScript 配置

### 5.1 创建基础 tsconfig

在项目根目录创建 `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    // 基本选项
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "jsx": "react-jsx",
    
    // 模块解析
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    
    // 类型检查
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    
    // 输出
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    
    // 其他
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": true,
    "composite": true,
    "incremental": true
  },
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "coverage"
  ]
}
```

### 5.2 创建根 tsconfig.json

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@gamehub/shared/*": ["./packages/shared/src/*"],
      "@gamehub/backend/*": ["./packages/backend/src/*"],
      "@gamehub/frontend-web/*": ["./packages/frontend-web/src/*"]
    }
  },
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/backend" },
    { "path": "./packages/frontend-web" }
  ]
}
```

---

## Step 6: 创建 shared 包

### 6.1 创建目录结构

```bash
mkdir -p packages/shared/src/{types,utils,constants,validation}
cd packages/shared
```

### 6.2 创建 package.json

在 `packages/shared/package.json`:

```json
{
  "name": "@gamehub/shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./types": {
      "import": "./dist/types/index.mjs",
      "require": "./dist/types/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.mjs",
      "require": "./dist/utils/index.js",
      "types": "./dist/utils/index.d.ts"
    },
    "./validation": {
      "import": "./dist/validation/index.mjs",
      "require": "./dist/validation/index.js",
      "types": "./dist/validation/index.d.ts"
    },
    "./constants": {
      "import": "./dist/constants/index.mjs",
      "require": "./dist/constants/index.js",
      "types": "./dist/constants/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "tsup": "^8.0.1"
  }
}
```

### 6.3 创建 tsconfig.json

在 `packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 6.4 创建构建配置

在 `packages/shared/tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'utils/index': 'src/utils/index.ts',
    'validation/index': 'src/validation/index.ts',
    'constants/index': 'src/constants/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
})
```

### 6.5 创建基础文件

```bash
# src/index.ts
touch src/index.ts
echo "export * from './types'" > src/index.ts
echo "export * from './utils'" >> src/index.ts
echo "export * from './constants'" >> src/index.ts

# src/types/index.ts
mkdir -p src/types
echo "export * from './common.types'" > src/types/index.ts

# src/types/common.types.ts
cat > src/types/common.types.ts << 'EOF'
/**
 * 通用类型定义
 */

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  message?: string
  data?: T
}
EOF

# src/utils/index.ts
mkdir -p src/utils
echo "export * from './common.utils'" > src/utils/index.ts

# src/utils/common.utils.ts
cat > src/utils/common.utils.ts << 'EOF'
/**
 * 通用工具函数
 */

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
EOF

# src/constants/index.ts
mkdir -p src/constants
echo "export * from './errors'" > src/constants/index.ts

# src/constants/errors.ts
cat > src/constants/errors.ts << 'EOF'
/**
 * 错误常量
 */

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]
EOF
```

### 6.6 构建 shared 包

```bash
cd packages/shared
pnpm install
pnpm build

# 应该在 dist 目录看到构建产物
ls -la dist
```

---

## 验证

### 验证 1: pnpm workspace 工作正常

```bash
cd ../../  # 回到项目根目录
pnpm list --depth 0

# 应该看到:
# ├── @gamehub/shared@1.0.0
```

### 验证 2: TypeScript 编译成功

```bash
cd packages/shared
pnpm typecheck

# 应该无错误
```

### 验证 3: 构建成功

```bash
cd packages/shared
pnpm build

# 检查构建产物
ls -la dist

# 应该看到:
# dist/
# ├── index.js
# ├── index.mjs
# ├── index.d.ts
# ├── types/
# ├── utils/
# └── constants/
```

### 验证 4: Turborepo 工作正常

```bash
cd ../../  # 回到项目根目录
turbo run build --filter=@gamehub/shared

# 应该成功构建
# 第二次运行应该使用缓存
turbo run build --filter=@gamehub/shared
# 应该看到: "cache hit"
```

---

## 常见问题

### Q1: pnpm install 很慢

**解决方案**:
```bash
# 配置国内镜像
pnpm config set registry https://registry.npmmirror.com

# 或使用淘宝镜像
pnpm config set registry https://registry.npm.taobao.org
```

### Q2: TypeScript 找不到模块

**解决方案**:
```bash
# 确保 tsconfig.json 的 paths 配置正确
# 确保运行了 pnpm build

# 清理并重新构建
pnpm clean
pnpm install
pnpm build
```

### Q3: Turbo 缓存不工作

**解决方案**:
```bash
# 清除 Turbo 缓存
rm -rf .turbo

# 检查 turbo.json 的 outputs 配置
# 确保输出目录正确
```

### Q4: Windows 上路径问题

**解决方案**:
```bash
# 使用 PowerShell 或 Git Bash
# 避免使用 CMD

# 或在 package.json 中使用 cross-env
pnpm add -Dw cross-env
```

---

## 下一步

✅ Monorepo 基础结构已搭建完成！

继续下一步：
👉 **[代码迁移指南](./02-code-migration.md)**

---

## 检查清单

完成以下检查后，才能继续下一步：

- [ ] pnpm workspace 配置完成
- [ ] Turborepo 配置完成
- [ ] TypeScript 配置完成
- [ ] shared 包创建完成
- [ ] shared 包构建成功
- [ ] Turbo 缓存工作正常
- [ ] 所有验证步骤通过

---

**恭喜！你已经完成了 Monorepo 的基础搭建！** 🎉

