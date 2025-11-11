# GameHub 项目初始化指南

## 1. 环境准备

### 1.1 必需软件
- **Node.js**：v18.0+ (推荐使用 LTS 版本)
- **npm**：v8.0+ 或 **yarn**：v1.22+
- **Git**：最新版本
- **MySQL**：v8.0+
- **Redis**：v6.0+
- **Docker**：v20.0+ (可选，用于容器化部署)

### 1.2 开发工具
- **IDE**：VS Code (推荐) / WebStorm
- **API工具**：Postman / Insomnia
- **数据库工具**：MySQL Workbench / DBeaver
- **Redis工具**：Redis Desktop Manager
- **版本控制**：Git + SourceTree (可选)

### 1.3 VS Code 插件推荐
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-jest",
    "humao.rest-client",
    "ms-vscode-remote.remote-containers"
  ]
}
```

## 2. 项目克隆与设置

### 2.1 克隆项目
```bash
# 克隆项目
git clone https://github.com/your-org/gamehub.git

# 进入项目目录
cd gamehub
```

### 2.2 安装依赖
```bash
# 安装前端依赖
cd frontend
npm install
# 或
yarn install

# 安装后端依赖
cd ../backend
npm install
# 或
yarn install
```

### 2.3 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
# 根据本地环境配置数据库连接等信息
```

## 3. 数据库设置

### 3.1 MySQL 设置
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE gamehub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户
CREATE USER 'gamehub'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON gamehub.* TO 'gamehub'@'localhost';
FLUSH PRIVILEGES;
```

### 3.2 数据库迁移
```bash
# 运行数据库迁移
cd backend
npm run migrate

# 填充初始数据
npm run seed
```

## 4. 本地开发启动

### 4.1 启动后端服务
```bash
# 进入后端目录
cd backend

# 启动开发服务器
npm run dev

# 服务将在 http://localhost:3000 启动
```

### 4.2 启动前端服务
```bash
# 进入前端目录
cd frontend

# 启动开发服务器
npm run dev

# 应用将在 http://localhost:5173 启动
```

### 4.3 启动Redis
```bash
# Windows
redis-server

# macOS/Linux
sudo systemctl start redis
# 或
redis-server /usr/local/etc/redis.conf
```

## 5. 开发工具配置

### 5.1 Git 配置
```bash
# 设置全局配置
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 设置项目特定配置
git config core.autocrlf input
git config core.safecrlf warn
```

### 5.2 代码格式化配置
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 5.3 ESLint 配置
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

## 6. 开发流程

### 6.1 分支管理
```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 提交代码
git add .
git commit -m "feat: add your feature description"

# 推送分支
git push origin feature/your-feature-name
```

### 6.2 提交信息规范
使用约定式提交格式：
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型说明：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 6.3 代码审查流程
1. 创建 Pull Request
2. 请求代码审查
3. 根据反馈修改代码
4. 通过审查后合并代码

## 7. 测试

### 7.1 运行测试
```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

### 7.2 端到端测试
```bash
# 运行端到端测试
npm run test:e2e

# 运行特定测试文件
npm run test:e2e -- --spec "login.spec.ts"
```

## 8. 构建与部署

### 8.1 本地构建
```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd backend
npm run build
```

### 8.2 Docker 部署
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 9. 常见问题

### 9.1 依赖安装问题
```bash
# 清除缓存
npm cache clean --force

# 删除node_modules和package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 9.2 端口占用问题
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000

# 结束进程
taskkill /PID <PID> /F
```

### 9.3 数据库连接问题
- 检查MySQL服务是否启动
- 验证数据库连接配置
- 确认用户权限设置正确

## 10. 开发资源

### 10.1 项目文档
- [项目宪章](./docs/GameHub_项目宪章.md)
- [开发规范](./docs/GameHub_开发规范.md)
- [工作流程](./docs/GameHub_工作流程.md)
- [API文档](./docs/API.md)
- [架构文档](./docs/架构.md)

### 10.2 有用链接
- [React官方文档](https://react.dev/)
- [Node.js官方文档](https://nodejs.org/docs/)
- [MySQL官方文档](https://dev.mysql.com/doc/)
- [Redis官方文档](https://redis.io/documentation)

### 10.3 团队沟通
- 技术讨论：使用团队沟通工具
- 问题反馈：创建Issue或联系项目负责人
- 紧急问题：直接联系相关负责人

---

## 初始化检查清单

- [ ] 安装必需软件和开发工具
- [ ] 克隆项目并安装依赖
- [ ] 配置环境变量
- [ ] 设置数据库
- [ ] 启动本地开发环境
- [ ] 配置开发工具
- [ ] 阅读项目文档
- [ ] 了解团队协作流程

完成以上步骤后，您就可以开始参与GameHub项目的开发了！如有任何问题，请随时联系团队。

**最后更新**：2023年12月