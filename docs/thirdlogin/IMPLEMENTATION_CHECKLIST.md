# 多平台游戏与第三方登录 - 实施检查清单

## 📋 使用说明

本检查清单帮助你跟踪实施进度，确保不遗漏任何步骤。

**使用方法**:
- 完成一项，在 `[ ]` 中打勾 `[x]`
- 标记 ⚠️ 的是关键步骤，必须完成
- 标记 🔧 的是配置步骤
- 标记 ✨ 的是新建文件
- 标记 🧪 的是测试步骤

---

## 🎮 需求一：多平台游戏支持

### Phase 1: 数据库设计 (预计 2天)

#### 数据库迁移

- [ ] ⚠️ 创建迁移文件 `010_add_game_platforms.ts`
- [ ] ⚠️ 添加 `platform` 字段 (varchar)
- [ ] ⚠️ 添加 `load_type` 字段 (varchar)
- [ ] ⚠️ 添加 `platform_config` 字段 (jsonb)
- [ ] ⚠️ 添加 `supported_platforms` 字段 (jsonb)
- [ ] 创建 `platform` 索引
- [ ] 创建 `platform + status` 复合索引
- [ ] ⚠️ 执行迁移 `npm run migration:run`
- [ ] 🧪 验证表结构正确

#### 实体更新

- [ ] ⚠️ 更新 `game.entity.ts` 添加 `GamePlatform` 枚举
- [ ] ⚠️ 更新 `game.entity.ts` 添加 `GameLoadType` 枚举
- [ ] ⚠️ 更新 `game.entity.ts` 添加 `PlatformConfig` 接口
- [ ] 添加 `platform` 字段装饰器
- [ ] 添加 `loadType` 字段装饰器
- [ ] 添加 `platformConfig` 字段装饰器
- [ ] 添加 `supportedPlatforms` 字段装饰器
- [ ] 添加 `supportsCurrentPlatform()` 方法
- [ ] 添加 `getPlatformConfig()` 方法
- [ ] 🧪 TypeScript 编译无错误

### Phase 2: 后端适配器 (预计 1周)

#### 基础接口

- [ ] ✨ 创建 `base.adapter.ts`
- [ ] 定义 `GameLaunchParams` 接口
- [ ] 定义 `GameLaunchResult` 接口
- [ ] 定义 `BasePlatformAdapter` 抽象类
- [ ] 定义必须实现的方法

#### HTML5 适配器

- [ ] ✨ 创建 `html5.adapter.ts`
- [ ] 实现 `validateConfig()` 方法
- [ ] ⚠️ 实现 `prepareLaunch()` 方法
- [ ] 实现 `trackSession()` 方法
- [ ] 实现 URL 参数拼接逻辑
- [ ] 🧪 单元测试覆盖 > 80%

#### 微信小游戏适配器

- [ ] ✨ 创建 `wechat.adapter.ts`
- [ ] 🔧 配置微信 APP_ID 和 SECRET
- [ ] 实现 `validateConfig()` 方法
- [ ] ⚠️ 实现 `prepareLaunch()` 方法
- [ ] 实现 `trackSession()` 方法
- [ ] ⚠️ 实现 `generateQRCode()` 方法
- [ ] 实现 `getAccessToken()` 方法
- [ ] 添加 token 缓存逻辑
- [ ] 🧪 单元测试覆盖 > 80%
- [ ] 🧪 测试二维码生成

#### 抖音小游戏适配器

- [ ] ✨ 创建 `douyin.adapter.ts`
- [ ] 🔧 配置抖音 CLIENT_KEY 和 SECRET
- [ ] 实现 `validateConfig()` 方法
- [ ] ⚠️ 实现 `prepareLaunch()` 方法
- [ ] 实现 `trackSession()` 方法
- [ ] 实现 URL Scheme 生成
- [ ] 🧪 单元测试覆盖 > 80%

#### 平台服务

- [ ] ✨ 创建 `game-platform.service.ts`
- [ ] 注册所有适配器
- [ ] ⚠️ 实现 `prepareLaunch()` 方法
- [ ] 实现 `detectPlatform()` 方法
- [ ] 实现 `getSupportedPlatforms()` 方法
- [ ] 实现 `generateQRCode()` 方法
- [ ] 实现 `trackSession()` 方法
- [ ] 🧪 集成测试

#### 控制器更新

- [ ] 🔧 更新 `games.controller.ts`
- [ ] ⚠️ 添加 `POST /games/:id/launch` 端点
- [ ] 添加 `GET /games/:id/qrcode` 端点
- [ ] 添加 `GET /games/detect-platform` 端点
- [ ] 🧪 API 测试

#### 模块配置

- [ ] 🔧 更新 `games.module.ts`
- [ ] 导入 `HttpModule`
- [ ] 注册所有适配器 Provider
- [ ] 注册 `GamePlatformService`
- [ ] 导出 `GamePlatformService`
- [ ] 🧪 依赖注入测试

### Phase 3: 前端实现 (预计 1周)

#### 平台检测

- [ ] ✨ 创建 `platform-detector.ts`
- [ ] 定义 `PlatformType` 枚举
- [ ] 定义 `PlatformInfo` 接口
- [ ] ⚠️ 实现 `detectPlatform()` 函数
- [ ] 实现 `isPlatformSupported()` 函数
- [ ] 实现 `getPlatformName()` 函数
- [ ] 实现 `getPlatformIcon()` 函数
- [ ] 🧪 单元测试

#### HTML5 播放器

- [ ] ✨ 创建 `Html5GamePlayer.tsx`
- [ ] 实现 iframe 加载逻辑
- [ ] ⚠️ 实现 postMessage 通信
- [ ] 实现加载状态显示
- [ ] 实现错误处理
- [ ] 配置 sandbox 权限
- [ ] 添加加载超时处理
- [ ] 🧪 组件测试

#### 微信启动器

- [ ] ✨ 创建 `WechatGameLauncher.tsx`
- [ ] 判断当前环境
- [ ] ⚠️ 实现微信环境启动逻辑
- [ ] 实现 SDK 调用
- [ ] ⚠️ 实现 QR 码显示组件
- [ ] 添加错误提示
- [ ] 🧪 组件测试

#### 抖音启动器

- [ ] ✨ 创建 `DouyinGameLauncher.tsx`
- [ ] 判断当前环境
- [ ] ⚠️ 实现抖音环境启动逻辑
- [ ] 实现 SDK 调用
- [ ] 实现 URL Scheme 跳转
- [ ] 添加错误提示
- [ ] 🧪 组件测试

#### 游戏加载器

- [ ] ✨ 创建 `GameLoader.tsx`
- [ ] ⚠️ 实现平台路由逻辑
- [ ] 支持多平台切换
- [ ] 实现 Tabs 切换
- [ ] 添加平台不支持提示
- [ ] 🧪 组件测试

#### 页面集成

- [ ] 🔧 更新 `GamePlayer.tsx`
- [ ] 集成 `GameLoader` 组件
- [ ] 处理会话管理
- [ ] 添加退出功能
- [ ] 优化用户体验
- [ ] 🧪 E2E 测试

### Phase 4: 测试优化 (预计 3天)

#### 单元测试

- [ ] 🧪 后端适配器测试 > 80% 覆盖
- [ ] 🧪 平台服务测试 > 80% 覆盖
- [ ] 🧪 前端工具函数测试 > 80% 覆盖
- [ ] 🧪 前端组件测试 > 70% 覆盖

#### 集成测试

- [ ] 🧪 HTML5 游戏完整流程
- [ ] 🧪 微信小游戏完整流程
- [ ] 🧪 抖音小游戏完整流程
- [ ] 🧪 平台切换功能
- [ ] 🧪 二维码生成功能

#### 兼容性测试

- [ ] 🧪 Chrome 浏览器
- [ ] 🧪 Safari 浏览器
- [ ] 🧪 Firefox 浏览器
- [ ] 🧪 Edge 浏览器
- [ ] 🧪 微信内置浏览器
- [ ] 🧪 抖音 APP
- [ ] 🧪 iOS 设备
- [ ] 🧪 Android 设备

#### 性能优化

- [ ] 游戏加载时间 < 3秒
- [ ] API 响应时间 < 200ms
- [ ] 二维码生成 < 1秒
- [ ] 添加加载进度提示
- [ ] 优化图片资源
- [ ] 添加缓存策略

---

## 🔐 需求二：多平台第三方登录

### Phase 5: 后端 OAuth (预计 1周)

#### 数据准备

- [ ] ⚠️ 扩展 `AuthType` 枚举
- [ ] 添加 `ALIPAY` 类型
- [ ] 添加 `WEIBO` 类型
- [ ] 添加 `DOUYIN` 类型
- [ ] 添加 `GOOGLE` 类型
- [ ] ⚠️ 创建数据库迁移
- [ ] ⚠️ 执行迁移

#### 接口定义

- [ ] ✨ 创建 `oauth-provider.interface.ts`
- [ ] 定义 `OAuthConfig` 接口
- [ ] 定义 `OAuthUserInfo` 接口
- [ ] 定义 `OAuthTokens` 接口
- [ ] ⚠️ 定义 `IOAuthProvider` 接口

#### OAuth Providers

##### 微信

- [ ] 🔧 创建/更新 `wechat-oauth.provider.ts`
- [ ] 🔧 配置 APP_ID 和 SECRET
- [ ] 实现 `getAuthorizationUrl()`
- [ ] 实现 `exchangeCode()`
- [ ] 实现 `getUserInfo()`
- [ ] 实现 `validateToken()`
- [ ] 🧪 单元测试

##### QQ

- [ ] 🔧 创建/更新 `qq-oauth.provider.ts`
- [ ] 🔧 配置 APP_ID 和 APP_KEY
- [ ] 实现所有接口方法
- [ ] 🧪 单元测试

##### 支付宝 ✨

- [ ] ✨ 创建 `alipay-oauth.provider.ts`
- [ ] 🔧 配置 APP_ID 和密钥
- [ ] ⚠️ 实现 RSA 签名逻辑
- [ ] 实现所有接口方法
- [ ] 🧪 单元测试

##### 微博 ✨

- [ ] ✨ 创建 `weibo-oauth.provider.ts`
- [ ] 🔧 配置 APP_KEY 和 SECRET
- [ ] 实现所有接口方法
- [ ] 🧪 单元测试

##### 抖音 ✨

- [ ] ✨ 创建 `douyin-oauth.provider.ts`
- [ ] 🔧 配置 CLIENT_KEY 和 SECRET
- [ ] 实现所有接口方法
- [ ] 🧪 单元测试

##### Google ✨

- [ ] ✨ 创建 `google-oauth.provider.ts`
- [ ] 🔧 配置 CLIENT_ID 和 SECRET
- [ ] 实现所有接口方法
- [ ] 🧪 单元测试

##### Apple

- [ ] 🔧 创建/更新 `apple-oauth.provider.ts`
- [ ] 🔧 配置证书和密钥
- [ ] 实现所有接口方法
- [ ] 🧪 单元测试

#### OAuth 服务

- [ ] ✨ 创建 `oauth.service.ts`
- [ ] 注册所有 OAuth Provider
- [ ] ⚠️ 实现 `getAuthorizationUrl()`
- [ ] ⚠️ 实现 `handleCallback()`
- [ ] 实现 `createUserWithOAuth()`
- [ ] 实现 `bindOAuthAccount()`
- [ ] 实现 `unbindOAuthAccount()`
- [ ] 实现 `generateTokens()`
- [ ] 🧪 集成测试

#### OAuth 控制器

- [ ] ✨ 创建 `oauth.controller.ts`
- [ ] ⚠️ 实现 `GET /:provider/url` 端点
- [ ] ⚠️ 实现 `POST /:provider/callback` 端点
- [ ] 实现 `POST /:provider/bind` 端点
- [ ] 实现 `DELETE /:provider/unbind` 端点
- [ ] 添加参数验证
- [ ] 添加错误处理
- [ ] 🧪 API 测试

#### 环境配置

- [ ] 🔧 更新 `.env.example`
- [ ] 🔧 添加微信配置
- [ ] 🔧 添加QQ配置
- [ ] 🔧 添加支付宝配置
- [ ] 🔧 添加微博配置
- [ ] 🔧 添加抖音配置
- [ ] 🔧 添加Google配置
- [ ] 🔧 添加Apple配置
- [ ] ⚠️ 配置生产环境变量

### Phase 6: 前端实现 (预计 1周)

#### 社交登录按钮

- [ ] ✨ 创建 `SocialLoginButtons.tsx`
- [ ] 添加微信登录按钮
- [ ] 添加QQ登录按钮
- [ ] ✨ 添加支付宝登录按钮
- [ ] ✨ 添加微博登录按钮
- [ ] ✨ 添加抖音登录按钮
- [ ] ✨ 添加Google登录按钮
- [ ] 添加Apple登录按钮
- [ ] ⚠️ 实现跳转逻辑
- [ ] 实现 state 生成
- [ ] 添加加载状态
- [ ] 🧪 组件测试

#### OAuth 回调页

- [ ] ✨ 创建 `OAuthCallback.tsx`
- [ ] ⚠️ 实现回调处理
- [ ] ⚠️ 验证 state 参数
- [ ] 调用后端 callback 接口
- [ ] 保存用户信息和 token
- [ ] 处理错误情况
- [ ] 重定向到首页
- [ ] 🧪 页面测试

#### 路由配置

- [ ] 🔧 更新 `App.tsx`
- [ ] ⚠️ 添加 OAuth 回调路由
- [ ] 配置路由参数
- [ ] 🧪 路由测试

#### 登录页集成

- [ ] 🔧 更新 `LoginPage.tsx`
- [ ] 集成社交登录按钮
- [ ] 添加分隔线
- [ ] 优化布局
- [ ] 添加说明文字
- [ ] 🧪 页面测试

#### 账号绑定页

- [ ] ✨ 创建 `AccountBinding.tsx`
- [ ] 显示已绑定账号
- [ ] 实现绑定功能
- [ ] 实现解绑功能
- [ ] 添加确认对话框
- [ ] 🧪 功能测试

### Phase 7: 测试优化 (预计 3天)

#### 功能测试

- [ ] 🧪 微信登录完整流程
- [ ] 🧪 QQ登录完整流程
- [ ] 🧪 支付宝登录完整流程
- [ ] 🧪 微博登录完整流程
- [ ] 🧪 抖音登录完整流程
- [ ] 🧪 Google登录完整流程
- [ ] 🧪 Apple登录完整流程
- [ ] 🧪 新用户注册流程
- [ ] 🧪 老用户登录流程
- [ ] 🧪 账号绑定功能
- [ ] 🧪 账号解绑功能

#### 安全测试

- [ ] ⚠️ 🧪 State 参数验证
- [ ] ⚠️ 🧪 CSRF 防护
- [ ] ⚠️ 🧪 Token 安全存储
- [ ] 🧪 敏感信息加密
- [ ] 🧪 API 鉴权测试
- [ ] 🧪 XSS 防护
- [ ] 🧪 SQL 注入防护

#### 兼容性测试

- [ ] 🧪 Chrome 浏览器
- [ ] 🧪 Safari 浏览器
- [ ] 🧪 Firefox 浏览器
- [ ] 🧪 Edge 浏览器
- [ ] 🧪 微信内置浏览器
- [ ] 🧪 各平台 APP 内
- [ ] 🧪 iOS 设备
- [ ] 🧪 Android 设备

#### 性能测试

- [ ] 授权跳转延迟 < 500ms
- [ ] 回调处理时间 < 1s
- [ ] API 响应时间 < 200ms
- [ ] 并发测试
- [ ] 压力测试

---

## 📈 Phase 8: 集成与上线 (预计 3天)

### 准备工作

- [ ] ⚠️ 🔧 配置生产域名
- [ ] ⚠️ 🔧 配置 HTTPS 证书
- [ ] ⚠️ 🔧 申请生产环境应用
- [ ] 🔧 配置 OAuth 回调白名单
- [ ] 🔧 配置 CDN
- [ ] 🔧 配置日志收集
- [ ] 🔧 配置监控告警

### 数据迁移

- [ ] ⚠️ 备份生产数据库
- [ ] ⚠️ 运行迁移脚本
- [ ] 验证数据完整性
- [ ] 测试数据兼容性

### 部署

- [ ] 构建后端生产版本
- [ ] 构建前端生产版本
- [ ] 部署后端服务
- [ ] 部署前端应用
- [ ] 配置反向代理
- [ ] 配置负载均衡
- [ ] 🧪 冒烟测试

### 监控

- [ ] 配置应用监控
- [ ] 配置错误监控
- [ ] 配置性能监控
- [ ] 配置日志分析
- [ ] 设置告警规则
- [ ] 测试告警功能

### 文档

- [ ] 更新 API 文档
- [ ] 更新部署文档
- [ ] 编写运维手册
- [ ] 编写故障处理手册
- [ ] 更新用户指南

---

## ✅ 最终验收

### 功能验收

- [ ] ⚠️ 支持 3 种游戏平台
- [ ] ⚠️ 支持 7 种登录方式
- [ ] 游戏启动成功率 > 95%
- [ ] OAuth 授权成功率 > 98%
- [ ] 平台自动检测正常
- [ ] 多平台切换正常
- [ ] 账号绑定功能正常
- [ ] 账号解绑功能正常

### 性能验收

- [ ] 游戏加载时间 < 3秒
- [ ] OAuth 跳转延迟 < 500ms
- [ ] API 响应时间 P95 < 200ms
- [ ] 二维码生成 < 1秒
- [ ] 并发 1000 用户无问题

### 安全验收

- [ ] ⚠️ 通过安全扫描
- [ ] ⚠️ CSRF 防护有效
- [ ] ⚠️ Token 安全存储
- [ ] 无敏感信息泄露
- [ ] 日志不含敏感数据

### 用户体验

- [ ] 加载速度快
- [ ] 错误提示清晰
- [ ] 交互流畅
- [ ] 支持移动端
- [ ] 界面美观

---

## 📊 进度跟踪

### 整体进度

- 多平台游戏支持: `0/69` 项 ( 0% )
- 第三方登录: `0/98` 项 ( 0% )
- 集成与上线: `0/28` 项 ( 0% )

**总计**: `0/195` 项 ( 0% )

### 各阶段进度

| 阶段 | 进度 | 状态 |
|------|------|------|
| Phase 1: 数据库设计 | 0/18 | ⬜️ 未开始 |
| Phase 2: 后端适配器 | 0/51 | ⬜️ 未开始 |
| Phase 3: 前端实现 | 0/47 | ⬜️ 未开始 |
| Phase 4: 测试优化 | 0/22 | ⬜️ 未开始 |
| Phase 5: OAuth 后端 | 0/62 | ⬜️ 未开始 |
| Phase 6: OAuth 前端 | 0/36 | ⬜️ 未开始 |
| Phase 7: OAuth 测试 | 0/30 | ⬜️ 未开始 |
| Phase 8: 集成上线 | 0/28 | ⬜️ 未开始 |

---

## 🎯 每日站会检查项

每日检查以下内容：

- [ ] 昨日完成的任务
- [ ] 今日计划完成的任务
- [ ] 遇到的问题和阻塞
- [ ] 需要的支持和帮助
- [ ] 更新进度跟踪

---

## 📝 注意事项

1. **标记完成**: 完成一项后立即在清单中打勾
2. **优先级**: 带 ⚠️ 标记的是高优先级，必须完成
3. **测试**: 带 🧪 标记的需要测试验证
4. **配置**: 带 🔧 标记的需要配置环境
5. **协作**: 及时沟通进度和问题

---

**创建时间**: 2024-11-12  
**最后更新**: 2024-11-12  
**负责人**: ___________  
**版本**: v1.0

