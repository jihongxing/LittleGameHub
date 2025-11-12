# 多平台游戏与第三方登录 - 快速开始指南

## 🚀 5分钟快速开始

本文档帮助你快速了解如何实施多平台游戏和第三方登录功能。

---

## 📦 前置准备

### 1. 开发环境

```bash
# 确保已安装
Node.js >= 18
PostgreSQL >= 14
Redis >= 6
```

### 2. 第三方平台账号

申请以下平台的开发者账号并创建应用：

- [ ] 微信开放平台 (https://open.weixin.qq.com/)
- [ ] 抖音开放平台 (https://developer.open-douyin.com/)
- [ ] 支付宝开放平台 (https://open.alipay.com/)
- [ ] 微博开放平台 (https://open.weibo.com/)
- [ ] Google Cloud Console (https://console.cloud.google.com/)
- [ ] Apple Developer (https://developer.apple.com/)

---

## 🎯 需求一：多平台游戏支持

### 步骤 1: 数据库迁移

```bash
cd backend

# 创建迁移文件
npm run migration:create -- AddGamePlatforms

# 运行迁移
npm run migration:run
```

### 步骤 2: 创建后端文件

```
backend/src/modules/games/
├── services/
│   ├── platform-adapters/
│   │   ├── base.adapter.ts          ✨ 新建
│   │   ├── html5.adapter.ts         ✨ 新建
│   │   ├── wechat.adapter.ts        ✨ 新建
│   │   └── douyin.adapter.ts        ✨ 新建
│   └── game-platform.service.ts     ✨ 新建
├── entities/
│   └── game.entity.ts               🔧 修改
└── controllers/
    └── games.controller.ts          🔧 修改
```

### 步骤 3: 创建前端文件

```
frontend/src/
├── utils/
│   └── platform-detector.ts         ✨ 新建
└── components/business/
    ├── GameLoader.tsx               ✨ 新建
    ├── Html5GamePlayer.tsx          ✨ 新建
    ├── WechatGameLauncher.tsx       ✨ 新建
    └── DouyinGameLauncher.tsx       ✨ 新建
```

### 步骤 4: 测试

```bash
# 后端
cd backend
npm test -- game-platform

# 前端
cd frontend
npm test -- GameLoader
```

### 步骤 5: 添加游戏数据

```sql
-- 添加一个HTML5游戏
INSERT INTO games (
  title, 
  platform, 
  load_type, 
  game_url,
  platform_config
) VALUES (
  '测试HTML5游戏',
  'html5',
  'iframe',
  'https://example.com/game.html',
  '{"sandbox_permissions": ["allow-scripts", "allow-same-origin"]}'
);

-- 添加一个微信小游戏
INSERT INTO games (
  title, 
  platform, 
  load_type,
  platform_config
) VALUES (
  '测试微信小游戏',
  'wechat',
  'mini_program',
  '{
    "wechat_app_id": "wx1234567890abcdef",
    "wechat_path": "pages/index/index",
    "wechat_version": "release"
  }'
);
```

---

## 🔐 需求二：多平台第三方登录

### 步骤 1: 配置环境变量

创建 `backend/.env` 文件：

```bash
# 复制示例文件
cp backend/.env.example backend/.env

# 填写OAuth配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=http://localhost:3000/auth/callback/wechat

# ... 其他平台配置
```

### 步骤 2: 数据库迁移

```bash
cd backend
npm run migration:run
```

### 步骤 3: 创建后端文件

```
backend/src/modules/auth/
├── interfaces/
│   └── oauth-provider.interface.ts  ✨ 新建
├── providers/
│   ├── wechat-oauth.provider.ts     🔧 修改
│   ├── alipay-oauth.provider.ts     ✨ 新建
│   ├── weibo-oauth.provider.ts      ✨ 新建
│   ├── douyin-oauth.provider.ts     ✨ 新建
│   └── google-oauth.provider.ts     ✨ 新建
├── services/
│   └── oauth.service.ts             ✨ 新建
└── controllers/
    └── oauth.controller.ts          ✨ 新建
```

### 步骤 4: 创建前端文件

```
frontend/src/
├── components/auth/
│   └── SocialLoginButtons.tsx       ✨ 新建
└── pages/Auth/
    ├── OAuthCallback.tsx            ✨ 新建
    └── LoginPage.tsx                🔧 修改
```

### 步骤 5: 添加路由

在 `frontend/src/App.tsx` 中添加：

```typescript
<Route path="/auth/callback/:provider" element={<OAuthCallback />} />
```

### 步骤 6: 测试登录流程

1. 启动服务：
```bash
# 后端
cd backend && npm run dev

# 前端
cd frontend && npm run dev
```

2. 访问：http://localhost:5173/login

3. 点击任意第三方登录按钮

4. 完成授权后应该自动登录成功

---

## ✅ 快速验证清单

### 多平台游戏

- [ ] HTML5游戏能正常加载
- [ ] 微信环境能识别并显示启动按钮
- [ ] 非微信环境显示二维码
- [ ] 抖音环境能识别并启动
- [ ] 游戏会话正常跟踪

### 第三方登录

- [ ] 点击登录按钮能跳转到授权页
- [ ] 授权后能正确回调
- [ ] 新用户能自动创建账号
- [ ] 老用户能正常登录
- [ ] 用户信息正确保存

---

## 🐛 常见问题

### Q1: 游戏加载失败

**检查**:
- 游戏URL是否正确
- sandbox权限是否足够
- 控制台有无CORS错误

**解决**:
```typescript
// 在 game.platform_config 中添加
{
  "sandbox_permissions": [
    "allow-scripts",
    "allow-same-origin",
    "allow-popups",
    "allow-forms"
  ]
}
```

### Q2: OAuth跳转失败

**检查**:
- redirect_uri 是否在平台配置中
- client_id 和 secret 是否正确
- 回调URL格式是否正确

**解决**:
```bash
# 确保回调URL格式正确
https://yourdomain.com/auth/callback/wechat
```

### Q3: 微信小游戏无法启动

**检查**:
- 是否在微信环境中
- app_id 是否正确
- 小游戏是否已发布

**解决**:
- 在非微信环境显示二维码
- 检查 platform_config 配置

### Q4: 数据库迁移失败

**检查**:
- PostgreSQL是否启动
- 数据库连接配置是否正确
- 是否有权限

**解决**:
```bash
# 检查数据库连接
psql -h localhost -U postgres -d gamehub_db

# 重新运行迁移
npm run migration:revert
npm run migration:run
```

---

## 📞 获取帮助

### 文档

- 完整实施指南: `docs/IMPLEMENTATION_GUIDE_MULTI_PLATFORM.md`
- API文档: `docs/API_DOCUMENTATION.md`
- 架构文档: `docs/ARCHITECTURE.md`

### 示例代码

查看项目中的测试文件：
- `backend/tests/integration/game-platform.test.ts`
- `frontend/tests/component/GameLoader.test.tsx`

### 社区支持

- GitHub Issues
- 开发者文档
- 技术支持邮箱

---

## 🎉 完成！

恭喜你完成了多平台游戏和第三方登录的快速配置！

### 下一步

1. 添加更多游戏
2. 配置更多登录方式
3. 优化用户体验
4. 添加数据分析

---

**更新时间**: 2024-11-12  
**版本**: v1.0

