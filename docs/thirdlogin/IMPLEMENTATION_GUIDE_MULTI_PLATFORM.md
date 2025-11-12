# 多平台游戏与第三方登录实施指南

## 📋 文档概述

**文档版本**: v1.0  
**创建日期**: 2024-11-12  
**适用项目**: GameHub 小游戏聚合平台  
**实施周期**: 4-6 周

---

## 🎯 实施目标

### 需求一：多平台游戏支持

**目标**：支持 HTML5、微信小游戏、抖音小游戏三种游戏平台

**业务价值**：
- 扩大游戏资源池，增加平台内容丰富度
- 提升用户留存，满足不同用户的游戏偏好
- 打通微信、抖音生态，获取更多流量

**技术指标**：
- 支持 3+ 游戏平台
- 游戏启动成功率 > 95%
- 平台切换无感知
- API 响应时间 < 200ms

### 需求二：多平台第三方登录

**目标**：集成微信、QQ、支付宝、微博、抖音、Apple ID、Google 共 7 种第三方登录方式

**业务价值**：
- 降低注册门槛，提升用户注册转化率
- 获取更丰富的用户画像数据
- 提升用户体验，一键登录

**技术指标**：
- 支持 7+ 登录方式
- OAuth 授权成功率 > 98%
- 登录响应时间 < 1s
- 支持账号绑定和解绑

---

## 🏗️ 整体架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    前端层 (Frontend)                      │
├─────────────────────────────────────────────────────────┤
│  游戏加载器        │  平台检测器    │  第三方登录组件    │
│  GameLoader       │  Platform      │  OAuth Buttons    │
│                   │  Detector      │                    │
└────────────┬──────────────┬─────────────┬──────────────┘
             │              │             │
             ▼              ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                    后端层 (Backend)                       │
├─────────────────────────────────────────────────────────┤
│  游戏平台服务      │  平台适配器    │  OAuth 服务        │
│  Platform Service │  Adapters      │  OAuth Service    │
│                   │  - HTML5       │  - WeChat         │
│                   │  - WeChat      │  - Alipay         │
│                   │  - Douyin      │  - Weibo          │
│                   │                │  - Douyin         │
│                   │                │  - Google         │
│                   │                │  - Apple          │
└────────────┬──────────────┬─────────────┬──────────────┘
             │              │             │
             ▼              ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                  数据层 (Database)                        │
├─────────────────────────────────────────────────────────┤
│  games 表         │  user_auth_methods 表                │
│  + platform       │  + 扩展 auth_type                    │
│  + load_type      │  + provider_data                     │
│  + platform_config│  + is_primary                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📅 实施计划

### 整体时间线

| 阶段 | 任务 | 周期 | 依赖 |
|------|------|------|------|
| Phase 1 | 多平台游戏支持 - 数据库设计 | 2 天 | - |
| Phase 2 | 多平台游戏支持 - 后端实现 | 1 周 | Phase 1 |
| Phase 3 | 多平台游戏支持 - 前端实现 | 1 周 | Phase 2 |
| Phase 4 | 多平台游戏支持 - 测试优化 | 3 天 | Phase 3 |
| Phase 5 | 第三方登录 - 后端实现 | 1 周 | - |
| Phase 6 | 第三方登录 - 前端实现 | 1 周 | Phase 5 |
| Phase 7 | 第三方登录 - 测试优化 | 3 天 | Phase 6 |
| Phase 8 | 集成测试与上线准备 | 3 天 | All |

**总计**: 4-6 周

---

## 🚀 需求一：多平台游戏支持

### Phase 1: 数据库设计与迁移 (2天)

#### 步骤 1.1: 设计数据库表结构

**目标**: 扩展 games 表以支持多平台

**新增字段**:

```sql
-- 游戏平台类型
platform VARCHAR(20) NOT NULL DEFAULT 'html5'
  -- 可选值: 'html5', 'wechat', 'douyin', 'native'

-- 加载方式
load_type VARCHAR(20) NOT NULL DEFAULT 'iframe'
  -- 可选值: 'iframe', 'sdk', 'native_app', 'mini_program'

-- 平台特定配置 (JSONB)
platform_config JSONB NULL
  -- 存储各平台的配置参数

-- 支持的平台列表 (JSONB Array)
supported_platforms JSONB NOT NULL DEFAULT '["html5"]'
  -- 游戏可能支持多个平台
```

**platform_config 结构示例**:

```json
{
  // HTML5 配置
  "iframe_url": "https://example.com/game.html",
  "sandbox_permissions": [
    "allow-scripts",
    "allow-same-origin",
    "allow-popups"
  ],
  
  // 微信小游戏配置
  "wechat_app_id": "wx1234567890abcdef",
  "wechat_path": "pages/index/index",
  "wechat_version": "release",
  
  // 抖音小游戏配置
  "douyin_app_id": "tt1234567890",
  "douyin_path": "pages/game/index",
  "douyin_version": "1.0.0",
  
  // 通用配置
  "supported_devices": ["ios", "android", "web"],
  "min_client_version": "1.0.0"
}
```

#### 步骤 1.2: 创建数据库迁移文件

**文件**: `backend/src/database/migrations/010_add_game_platforms.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGamePlatforms1699999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 添加 platform 字段
    await queryRunner.addColumn(
      'games',
      new TableColumn({
        name: 'platform',
        type: 'varchar',
        length: '20',
        default: "'html5'",
        isNullable: false,
      })
    );

    // 2. 添加 load_type 字段
    await queryRunner.addColumn(
      'games',
      new TableColumn({
        name: 'load_type',
        type: 'varchar',
        length: '20',
        default: "'iframe'",
        isNullable: false,
      })
    );

    // 3. 添加 platform_config 字段
    await queryRunner.addColumn(
      'games',
      new TableColumn({
        name: 'platform_config',
        type: 'jsonb',
        isNullable: true,
      })
    );

    // 4. 添加 supported_platforms 字段
    await queryRunner.addColumn(
      'games',
      new TableColumn({
        name: 'supported_platforms',
        type: 'jsonb',
        default: "'[\"html5\"]'",
        isNullable: false,
      })
    );

    // 5. 创建索引
    await queryRunner.query(
      `CREATE INDEX "IDX_games_platform" ON "games" ("platform")`
    );

    // 6. 创建复合索引（用于按平台筛选活跃游戏）
    await queryRunner.query(
      `CREATE INDEX "IDX_games_platform_status" 
       ON "games" ("platform", "availability_status")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_games_platform_status"`);
    await queryRunner.query(`DROP INDEX "IDX_games_platform"`);
    await queryRunner.dropColumn('games', 'supported_platforms');
    await queryRunner.dropColumn('games', 'platform_config');
    await queryRunner.dropColumn('games', 'load_type');
    await queryRunner.dropColumn('games', 'platform');
  }
}
```

**执行迁移**:

```bash
cd backend
npm run migration:run
```

#### 步骤 1.3: 更新 Game 实体

**文件**: `backend/src/modules/games/entities/game.entity.ts`

**添加的代码**:

```typescript
// 在文件开头添加枚举定义
export enum GamePlatform {
  HTML5 = 'html5',
  WECHAT = 'wechat',
  DOUYIN = 'douyin',
  NATIVE = 'native',
}

export enum GameLoadType {
  IFRAME = 'iframe',
  SDK = 'sdk',
  NATIVE_APP = 'native_app',
  MINI_PROGRAM = 'mini_program',
}

export interface PlatformConfig {
  // HTML5 配置
  iframe_url?: string;
  sandbox_permissions?: string[];
  
  // 微信小游戏配置
  wechat_app_id?: string;
  wechat_path?: string;
  wechat_version?: string;
  
  // 抖音小游戏配置
  douyin_app_id?: string;
  douyin_path?: string;
  douyin_version?: string;
  
  // 通用配置
  supported_devices?: ('ios' | 'android' | 'web')[];
  min_client_version?: string;
}

// 在 Game 类中添加新字段
@Entity('games')
export class Game {
  // ... 现有字段 ...

  @Column({
    type: 'varchar',
    length: 20,
    default: GamePlatform.HTML5,
  })
  platform: GamePlatform;

  @Column({
    type: 'varchar',
    length: 20,
    default: GameLoadType.IFRAME,
    name: 'load_type',
  })
  loadType: GameLoadType;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'platform_config',
  })
  platformConfig: PlatformConfig | null;

  @Column({
    type: 'jsonb',
    default: ['html5'],
    name: 'supported_platforms',
  })
  supportedPlatforms: GamePlatform[];

  // 辅助方法
  supportsCurrentPlatform(currentPlatform: GamePlatform): boolean {
    return this.supportedPlatforms.includes(currentPlatform);
  }

  getPlatformConfig<T extends keyof PlatformConfig>(
    key: T
  ): PlatformConfig[T] | undefined {
    return this.platformConfig?.[key];
  }
}
```

---

### Phase 2: 后端平台适配器实现 (1周)

#### 步骤 2.1: 创建基础适配器接口

**文件**: `backend/src/modules/games/services/platform-adapters/base.adapter.ts`

```typescript
import { Game } from '../../entities/game.entity';
import { PlatformConfig } from '../../entities/game.entity';

export interface GameLaunchParams {
  gameId: string;
  userId: string;
  sessionId: string;
  platform: string;
  userAgent?: string;
}

export interface GameLaunchResult {
  success: boolean;
  launchUrl?: string;
  launchData?: any;
  error?: string;
  qrCodeUrl?: string;
}

export abstract class BasePlatformAdapter {
  /**
   * 验证平台配置是否完整
   */
  abstract validateConfig(config: PlatformConfig): boolean;

  /**
   * 准备游戏启动
   */
  abstract prepareLaunch(
    game: Game,
    params: GameLaunchParams
  ): Promise<GameLaunchResult>;

  /**
   * 跟踪游戏会话
   */
  abstract trackSession(sessionId: string, data: any): Promise<void>;

  /**
   * 生成二维码（可选）
   */
  async generateQRCode?(game: Game, sessionId: string): Promise<Buffer>;
}
```

#### 步骤 2.2: 实现 HTML5 适配器

**文件**: `backend/src/modules/games/services/platform-adapters/html5.adapter.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { BasePlatformAdapter, GameLaunchParams, GameLaunchResult } from './base.adapter';
import { Game, PlatformConfig } from '../../entities/game.entity';

@Injectable()
export class Html5Adapter extends BasePlatformAdapter {
  validateConfig(config: PlatformConfig): boolean {
    // HTML5 游戏只需要有 game_url 或 iframe_url
    return !!(config?.iframe_url);
  }

  async prepareLaunch(
    game: Game,
    params: GameLaunchParams
  ): Promise<GameLaunchResult> {
    // 验证游戏URL
    const gameUrl = game.platformConfig?.iframe_url || game.gameUrl;
    
    if (!gameUrl) {
      return {
        success: false,
        error: 'Game URL not configured',
      };
    }

    // 生成带参数的游戏URL（用于会话跟踪和积分计算）
    const launchUrl = this.buildGameUrl(gameUrl, {
      session_id: params.sessionId,
      user_id: params.userId,
      game_id: params.gameId,
      timestamp: Date.now().toString(),
    });

    return {
      success: true,
      launchUrl,
      launchData: {
        type: 'iframe',
        url: launchUrl,
        sandbox: game.platformConfig?.sandbox_permissions || [
          'allow-scripts',
          'allow-same-origin',
          'allow-popups',
          'allow-forms',
        ],
      },
    };
  }

  async trackSession(sessionId: string, data: any): Promise<void> {
    // HTML5 游戏的会话跟踪
    // 通过 postMessage 与 iframe 通信
    console.log(`Tracking HTML5 session: ${sessionId}`, data);
  }

  private buildGameUrl(
    baseUrl: string,
    params: Record<string, string>
  ): string {
    try {
      const url = new URL(baseUrl);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
      return url.toString();
    } catch (error) {
      // 如果不是有效的URL，返回原始URL
      return baseUrl;
    }
  }
}
```

#### 步骤 2.3: 实现微信小游戏适配器

**文件**: `backend/src/modules/games/services/platform-adapters/wechat.adapter.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BasePlatformAdapter, GameLaunchParams, GameLaunchResult } from './base.adapter';
import { Game, PlatformConfig } from '../../entities/game.entity';

@Injectable()
export class WechatAdapter extends BasePlatformAdapter {
  private readonly logger = new Logger(WechatAdapter.name);
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  validateConfig(config: PlatformConfig): boolean {
    return !!(config?.wechat_app_id && config?.wechat_path);
  }

  async prepareLaunch(
    game: Game,
    params: GameLaunchParams
  ): Promise<GameLaunchResult> {
    const config = game.platformConfig;
    
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: 'WeChat mini-game configuration incomplete',
      };
    }

    // 生成微信小游戏启动参数
    const query = new URLSearchParams({
      session_id: params.sessionId,
      user_id: params.userId,
      game_id: params.gameId,
    }).toString();

    // 微信小游戏 URL Scheme
    const launchUrl = `weixin://dl/minigame/${config.wechat_app_id}`;

    return {
      success: true,
      launchUrl,
      launchData: {
        type: 'wechat_mini_game',
        appId: config.wechat_app_id,
        path: config.wechat_path || 'pages/index/index',
        query,
        envVersion: config.wechat_version || 'release',
      },
    };
  }

  async trackSession(sessionId: string, data: any): Promise<void> {
    this.logger.log(`Tracking WeChat session: ${sessionId}`, data);
  }

  /**
   * 生成微信小程序二维码
   */
  async generateQRCode(game: Game, sessionId: string): Promise<Buffer> {
    try {
      const accessToken = await this.getAccessToken();
      const config = game.platformConfig;

      const response = await firstValueFrom(
        this.httpService.post(
          `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
          {
            scene: `sid=${sessionId}`,
            page: config?.wechat_path || 'pages/index/index',
            check_path: false,
            env_version: config?.wechat_version || 'release',
            width: 430,
          },
          {
            responseType: 'arraybuffer',
          }
        )
      );

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error('Failed to generate WeChat QR code:', error);
      throw error;
    }
  }

  /**
   * 获取微信 access_token
   */
  private async getAccessToken(): Promise<string> {
    // 检查缓存的 token 是否有效
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    const appId = this.configService.get('WECHAT_APP_ID');
    const secret = this.configService.get('WECHAT_APP_SECRET');

    const response = await firstValueFrom(
      this.httpService.get(
        'https://api.weixin.qq.com/cgi-bin/token',
        {
          params: {
            grant_type: 'client_credential',
            appid: appId,
            secret: secret,
          },
        }
      )
    );

    if (response.data.errcode) {
      throw new Error(`WeChat API error: ${response.data.errmsg}`);
    }

    this.accessToken = response.data.access_token;
    // 提前 5 分钟过期
    this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000;

    return this.accessToken;
  }
}
```

#### 步骤 2.4: 实现抖音小游戏适配器

**文件**: `backend/src/modules/games/services/platform-adapters/douyin.adapter.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BasePlatformAdapter, GameLaunchParams, GameLaunchResult } from './base.adapter';
import { Game, PlatformConfig } from '../../entities/game.entity';

@Injectable()
export class DouyinAdapter extends BasePlatformAdapter {
  private readonly logger = new Logger(DouyinAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  validateConfig(config: PlatformConfig): boolean {
    return !!(config?.douyin_app_id && config?.douyin_path);
  }

  async prepareLaunch(
    game: Game,
    params: GameLaunchParams
  ): Promise<GameLaunchResult> {
    const config = game.platformConfig;
    
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: 'Douyin mini-game configuration incomplete',
      };
    }

    // 生成启动参数
    const launchParams = {
      session_id: params.sessionId,
      user_id: params.userId,
      game_id: params.gameId,
    };

    const query = encodeURIComponent(JSON.stringify(launchParams));

    // 抖音小游戏 URL Scheme
    // 格式: snssdk1128://microapp?app_id=<appid>&start_page=<path>&params=<query>
    const launchUrl = `snssdk1128://microapp?app_id=${config.douyin_app_id}&start_page=${config.douyin_path}&params=${query}`;

    return {
      success: true,
      launchUrl,
      launchData: {
        type: 'douyin_mini_game',
        appId: config.douyin_app_id,
        path: config.douyin_path,
        query: launchParams,
      },
    };
  }

  async trackSession(sessionId: string, data: any): Promise<void> {
    this.logger.log(`Tracking Douyin session: ${sessionId}`, data);
  }
}
```

#### 步骤 2.5: 创建游戏平台服务

**文件**: `backend/src/modules/games/services/game-platform.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { GamePlatform } from '../entities/game.entity';
import { Html5Adapter } from './platform-adapters/html5.adapter';
import { WechatAdapter } from './platform-adapters/wechat.adapter';
import { DouyinAdapter } from './platform-adapters/douyin.adapter';
import { BasePlatformAdapter, GameLaunchParams, GameLaunchResult } from './platform-adapters/base.adapter';
import { Game } from '../entities/game.entity';

@Injectable()
export class GamePlatformService {
  private readonly logger = new Logger(GamePlatformService.name);
  private adapters: Map<GamePlatform, BasePlatformAdapter>;

  constructor(
    private readonly html5Adapter: Html5Adapter,
    private readonly wechatAdapter: WechatAdapter,
    private readonly douyinAdapter: DouyinAdapter,
  ) {
    this.adapters = new Map([
      [GamePlatform.HTML5, html5Adapter],
      [GamePlatform.WECHAT, wechatAdapter],
      [GamePlatform.DOUYIN, douyinAdapter],
    ]);
  }

  /**
   * 准备游戏启动
   */
  async prepareLaunch(
    game: Game,
    params: GameLaunchParams
  ): Promise<GameLaunchResult> {
    const adapter = this.adapters.get(game.platform);
    
    if (!adapter) {
      return {
        success: false,
        error: `Platform ${game.platform} not supported`,
      };
    }

    // 验证平台配置
    if (!adapter.validateConfig(game.platformConfig || {})) {
      return {
        success: false,
        error: `Invalid configuration for platform ${game.platform}`,
      };
    }

    try {
      const result = await adapter.prepareLaunch(game, params);
      this.logger.log(`Game launch prepared: ${game.id}, platform: ${game.platform}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to prepare launch for ${game.id}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to prepare game launch',
      };
    }
  }

  /**
   * 检测用户当前平台环境
   */
  detectPlatform(userAgent: string): GamePlatform {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('micromessenger')) {
      return GamePlatform.WECHAT;
    }
    
    if (ua.includes('aweme') || ua.includes('douyin')) {
      return GamePlatform.DOUYIN;
    }
    
    return GamePlatform.HTML5;
  }

  /**
   * 获取游戏支持的平台列表
   */
  getSupportedPlatforms(game: Game): GamePlatform[] {
    return game.supportedPlatforms || [game.platform];
  }

  /**
   * 生成游戏二维码
   */
  async generateQRCode(game: Game, sessionId: string): Promise<Buffer> {
    const adapter = this.adapters.get(game.platform);
    
    if (!adapter || !adapter.generateQRCode) {
      throw new Error(`QR code generation not supported for platform ${game.platform}`);
    }

    return adapter.generateQRCode(game, sessionId);
  }

  /**
   * 跟踪游戏会话
   */
  async trackSession(
    game: Game,
    sessionId: string,
    data: any
  ): Promise<void> {
    const adapter = this.adapters.get(game.platform);
    
    if (!adapter) {
      this.logger.warn(`No adapter found for platform ${game.platform}`);
      return;
    }

    await adapter.trackSession(sessionId, data);
  }
}
```

#### 步骤 2.6: 更新 GamesModule

**文件**: `backend/src/modules/games/games.module.ts`

**添加的代码**:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Game } from './entities/game.entity';
import { GameSession } from './entities/game-session.entity';
import { GamesService } from './services/games.service';
import { GamesController } from './controllers/games.controller';

// 导入平台适配器
import { Html5Adapter } from './services/platform-adapters/html5.adapter';
import { WechatAdapter } from './services/platform-adapters/wechat.adapter';
import { DouyinAdapter } from './services/platform-adapters/douyin.adapter';
import { GamePlatformService } from './services/game-platform.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, GameSession]),
    HttpModule, // 用于 OAuth 和平台 API 调用
  ],
  providers: [
    GamesService,
    // 平台适配器
    Html5Adapter,
    WechatAdapter,
    DouyinAdapter,
    GamePlatformService,
  ],
  controllers: [GamesController],
  exports: [GamesService, GamePlatformService],
})
export class GamesModule {}
```

#### 步骤 2.7: 更新游戏控制器

**文件**: `backend/src/modules/games/controllers/games.controller.ts`

**添加新的端点**:

```typescript
import { Controller, Post, Get, Param, Body, Headers, Res } from '@nestjs/common';
import { Response } from 'express';
import { GamePlatformService } from '../services/game-platform.service';
import { GamesService } from '../services/games.service';

@Controller('games')
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly gamePlatformService: GamePlatformService,
  ) {}

  /**
   * 准备游戏启动
   * POST /games/:id/launch
   */
  @Post(':id/launch')
  async launchGame(
    @Param('id') gameId: string,
    @Body() body: { session_id: string; user_id: string },
    @Headers('user-agent') userAgent: string,
  ) {
    const game = await this.gamesService.findOne(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }

    const result = await this.gamePlatformService.prepareLaunch(game, {
      gameId,
      userId: body.user_id,
      sessionId: body.session_id,
      platform: game.platform,
      userAgent,
    });

    return {
      success: result.success,
      launchUrl: result.launchUrl,
      launchData: result.launchData,
      error: result.error,
    };
  }

  /**
   * 获取游戏二维码
   * GET /games/:id/qrcode
   */
  @Get(':id/qrcode')
  async getGameQRCode(
    @Param('id') gameId: string,
    @Query('session_id') sessionId: string,
    @Res() res: Response,
  ) {
    const game = await this.gamesService.findOne(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }

    try {
      const qrCode = await this.gamePlatformService.generateQRCode(game, sessionId);
      
      res.setHeader('Content-Type', 'image/png');
      res.send(qrCode);
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * 检测平台
   * GET /games/detect-platform
   */
  @Get('detect-platform')
  detectPlatform(@Headers('user-agent') userAgent: string) {
    const platform = this.gamePlatformService.detectPlatform(userAgent);
    
    return {
      platform,
      userAgent,
    };
  }
}
```

---

### Phase 3: 前端平台支持实现 (1周)

#### 步骤 3.1: 创建平台检测工具

**文件**: `frontend/src/utils/platform-detector.ts`

```typescript
export enum PlatformType {
  HTML5 = 'html5',
  WECHAT = 'wechat',
  DOUYIN = 'douyin',
  MOBILE_APP = 'mobile_app',
}

export interface PlatformInfo {
  type: PlatformType;
  isWechat: boolean;
  isDouyin: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeixin: boolean;
  isQQ: boolean;
}

/**
 * 检测当前运行平台
 */
export function detectPlatform(): PlatformInfo {
  const ua = navigator.userAgent.toLowerCase();
  
  const isWechat = /micromessenger/.test(ua);
  const isDouyin = /aweme|douyin/.test(ua);
  const isMobile = /mobile|android|iphone|ipad|ipod/.test(ua);
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isWeixin = isWechat;
  const isQQ = /qq\//.test(ua);

  let type: PlatformType;
  if (isWechat) {
    type = PlatformType.WECHAT;
  } else if (isDouyin) {
    type = PlatformType.DOUYIN;
  } else {
    type = PlatformType.HTML5;
  }

  return {
    type,
    isWechat,
    isDouyin,
    isMobile,
    isIOS,
    isAndroid,
    isWeixin,
    isQQ,
  };
}

/**
 * 判断是否支持某个平台
 */
export function isPlatformSupported(
  gamePlatform: string,
  currentPlatform: PlatformInfo
): boolean {
  switch (gamePlatform) {
    case 'html5':
      return true; // HTML5 所有平台都支持
    case 'wechat':
      return currentPlatform.isWechat;
    case 'douyin':
      return currentPlatform.isDouyin;
    default:
      return false;
  }
}

/**
 * 获取平台显示名称
 */
export function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    html5: 'HTML5 游戏',
    wechat: '微信小游戏',
    douyin: '抖音小游戏',
    native: '原生游戏',
  };
  return names[platform] || platform;
}

/**
 * 获取平台图标
 */
export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    html5: '🌐',
    wechat: '💬',
    douyin: '🎵',
    native: '📱',
  };
  return icons[platform] || '🎮';
}
```

#### 步骤 3.2: 创建 HTML5 游戏播放器组件

**文件**: `frontend/src/components/business/Html5GamePlayer.tsx`

```typescript
import React, { useRef, useEffect, useState } from 'react';
import { Alert, Spin } from 'antd';

interface Html5GamePlayerProps {
  game: any; // Game 类型
  sessionId: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const Html5GamePlayer: React.FC<Html5GamePlayerProps> = ({
  game,
  sessionId,
  onLoad,
  onError,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 设置 postMessage 通信监听
    const handleMessage = (event: MessageEvent) => {
      // 验证消息来源
      try {
        const gameOrigin = new URL(game.game_url).origin;
        if (event.origin !== gameOrigin) {
          console.warn('Message from untrusted origin:', event.origin);
          return;
        }
      } catch (err) {
        console.error('Invalid game URL:', err);
        return;
      }

      // 处理游戏消息
      switch (event.data.type) {
        case 'game_ready':
          console.log('Game loaded successfully');
          setLoading(false);
          onLoad?.();
          break;
        
        case 'game_score':
          console.log('Game score update:', event.data.score);
          // 可以发送到后端保存分数
          break;
        
        case 'game_complete':
          console.log('Game completed');
          // 可以触发会话结束
          break;
        
        case 'game_error':
          console.error('Game error:', event.data.error);
          setError(event.data.error);
          onError?.(new Error(event.data.error));
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // 设置加载超时
    const loadTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        console.log('Game load timeout, assuming loaded');
        onLoad?.();
      }
    }, 10000); // 10秒超时

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(loadTimeout);
    };
  }, [game.game_url, loading, onLoad, onError]);

  const handleIframeLoad = () => {
    // iframe 加载完成
    setLoading(false);
    onLoad?.();
    
    // 向游戏发送初始化消息
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'init',
          sessionId,
          gameId: game.id,
        },
        '*'
      );
    }
  };

  const handleIframeError = () => {
    setError('游戏加载失败');
    setLoading(false);
    onError?.(new Error('Failed to load game iframe'));
  };

  const sandbox = game.platform_config?.sandbox_permissions?.join(' ') || 
    'allow-scripts allow-same-origin allow-popups allow-forms';

  const gameUrl = `${game.game_url}?session_id=${sessionId}&game_id=${game.id}`;

  if (error) {
    return (
      <Alert
        message="游戏加载失败"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="html5-game-player" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10,
          }}
        >
          <Spin size="large" />
          <span style={{ marginLeft: 16, color: 'white' }}>加载游戏中...</span>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={gameUrl}
        sandbox={sandbox}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        title={game.title}
      />
    </div>
  );
};
```

#### 步骤 3.3: 创建微信小游戏启动器

**文件**: `frontend/src/components/business/WechatGameLauncher.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { Button, Alert, Card, QRCode, Tabs, message } from 'antd';
import { WechatOutlined, QrcodeOutlined } from '@ant-design/icons';
import { detectPlatform } from '@/utils/platform-detector';

declare const wx: any; // 微信 JSSDK

interface WechatGameLauncherProps {
  game: any;
  sessionId: string;
}

export const WechatGameLauncher: React.FC<WechatGameLauncherProps> = ({
  game,
  sessionId,
}) => {
  const [launching, setLaunching] = useState(false);
  const [platform] = useState(() => detectPlatform());

  const handleLaunch = async () => {
    setLaunching(true);
    
    try {
      // 调用后端获取启动数据
      const response = await fetch(`/api/games/${game.id}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: 'current_user_id', // 从认证状态获取
        }),
      });
      
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '启动失败');
      }

      const { launchData } = result;

      // 使用微信 SDK 启动小游戏
      if (typeof wx !== 'undefined' && wx.miniProgram) {
        wx.miniProgram.navigateToMiniProgram({
          appId: launchData.appId,
          path: launchData.path,
          extraData: {
            session_id: sessionId,
          },
          envVersion: launchData.envVersion,
          success: () => {
            message.success('启动成功');
          },
          fail: (err: any) => {
            console.error('Launch failed:', err);
            message.error('启动失败：' + err.errMsg);
          },
        });
      } else {
        message.error('请在微信中打开');
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.message || '启动失败，请稍后重试');
    } finally {
      setLaunching(false);
    }
  };

  // 如果在微信环境中，显示启动按钮
  if (platform.isWechat) {
    return (
      <Card className="wechat-game-launcher">
        <Alert
          message="微信小游戏"
          description="点击下方按钮启动游戏"
          type="info"
          showIcon
          icon={<WechatOutlined />}
          style={{ marginBottom: 16 }}
        />
        <Button
          type="primary"
          size="large"
          icon={<WechatOutlined />}
          loading={launching}
          onClick={handleLaunch}
          block
          style={{ backgroundColor: '#07c160' }}
        >
          启动游戏
        </Button>
      </Card>
    );
  }

  // 非微信环境，显示二维码
  return <WechatGameQRCode game={game} sessionId={sessionId} />;
};

// 非微信环境显示二维码组件
export const WechatGameQRCode: React.FC<WechatGameLauncherProps> = ({
  game,
  sessionId,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取二维码
    const fetchQRCode = async () => {
      try {
        const response = await fetch(
          `/api/games/${game.id}/qrcode?session_id=${sessionId}&platform=wechat`
        );
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Failed to fetch QR code:', error);
        message.error('获取二维码失败');
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();

    return () => {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [game.id, sessionId]);

  return (
    <Card className="text-center">
      <Alert
        message="请使用微信扫码进入游戏"
        type="info"
        showIcon
        icon={<QrcodeOutlined />}
        style={{ marginBottom: 24 }}
      />
      
      {loading ? (
        <div>加载二维码中...</div>
      ) : qrCodeUrl ? (
        <img
          src={qrCodeUrl}
          alt="微信小游戏二维码"
          style={{ width: 250, height: 250, margin: '0 auto' }}
        />
      ) : (
        <div>获取二维码失败</div>
      )}
      
      <p style={{ marginTop: 16, color: '#666' }}>
        使用微信扫一扫，即可开始游戏
      </p>
    </Card>
  );
};
```

#### 步骤 3.4: 创建抖音小游戏启动器

**文件**: `frontend/src/components/business/DouyinGameLauncher.tsx`

```typescript
import React, { useState } from 'react';
import { Button, Alert, Card, message } from 'antd';
import { detectPlatform } from '@/utils/platform-detector';

declare const tt: any; // 抖音小程序 SDK

interface DouyinGameLauncherProps {
  game: any;
  sessionId: string;
}

export const DouyinGameLauncher: React.FC<DouyinGameLauncherProps> = ({
  game,
  sessionId,
}) => {
  const [launching, setLaunching] = useState(false);
  const [platform] = useState(() => detectPlatform());

  const handleLaunch = async () => {
    setLaunching(true);
    
    try {
      const response = await fetch(`/api/games/${game.id}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: 'current_user_id',
        }),
      });
      
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '启动失败');
      }

      const { launchData } = result;

      // 使用抖音 SDK 启动小游戏
      if (typeof tt !== 'undefined' && tt.navigateToMicroApp) {
        tt.navigateToMicroApp({
          appId: launchData.appId,
          path: launchData.path,
          extraData: {
            session_id: sessionId,
          },
          success: () => {
            message.success('启动成功');
          },
          fail: (err: any) => {
            console.error('Launch failed:', err);
            message.error('启动失败：' + err.errMsg);
          },
        });
      } else {
        // 尝试使用 URL Scheme
        window.location.href = result.launchUrl;
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.message || '启动失败，请稍后重试');
    } finally {
      setLaunching(false);
    }
  };

  if (platform.isDouyin) {
    return (
      <Card className="douyin-game-launcher">
        <Alert
          message="抖音小游戏"
          description="点击下方按钮启动游戏"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Button
          type="primary"
          size="large"
          loading={launching}
          onClick={handleLaunch}
          block
        >
          启动游戏
        </Button>
      </Card>
    );
  }

  return (
    <Card className="text-center">
      <Alert
        message="请在抖音中打开"
        description="此游戏仅支持在抖音APP中游玩"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <p style={{ color: '#666' }}>
        请复制链接到抖音APP中打开
      </p>
    </Card>
  );
};
```

#### 步骤 3.5: 创建游戏加载器组件（统一入口）

**文件**: `frontend/src/components/business/GameLoader.tsx`

```typescript
import React, { useState } from 'react';
import { Alert, Tabs } from 'antd';
import { detectPlatform, isPlatformSupported, getPlatformName } from '@/utils/platform-detector';
import { Html5GamePlayer } from './Html5GamePlayer';
import { WechatGameLauncher } from './WechatGameLauncher';
import { DouyinGameLauncher } from './DouyinGameLauncher';

interface GameLoaderProps {
  game: any;
  sessionId: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * 游戏加载器 - 根据游戏平台和当前环境选择合适的加载方式
 */
export const GameLoader: React.FC<GameLoaderProps> = ({
  game,
  sessionId,
  onLoad,
  onError,
}) => {
  const [currentPlatform] = useState(() => detectPlatform());
  const [selectedPlatform, setSelectedPlatform] = useState(game.platform);

  // 渲染对应平台的加载器
  const renderLoader = (platform: string) => {
    switch (platform) {
      case 'html5':
        return (
          <Html5GamePlayer
            game={game}
            sessionId={sessionId}
            onLoad={onLoad}
            onError={onError}
          />
        );
      
      case 'wechat':
        return (
          <WechatGameLauncher
            game={game}
            sessionId={sessionId}
          />
        );
      
      case 'douyin':
        return (
          <DouyinGameLauncher
            game={game}
            sessionId={sessionId}
          />
        );
      
      default:
        return (
          <Alert
            message="不支持的游戏平台"
            description={`游戏平台 ${platform} 暂不支持`}
            type="error"
            showIcon
          />
        );
    }
  };

  // 如果游戏支持多个平台，显示标签页切换
  const supportedPlatforms = game.supported_platforms || [game.platform];
  
  if (supportedPlatforms.length > 1) {
    const tabItems = supportedPlatforms.map((platform: string) => ({
      key: platform,
      label: getPlatformName(platform),
      children: renderLoader(platform),
      disabled: !isPlatformSupported(platform, currentPlatform),
    }));

    return (
      <div className="game-loader">
        <Tabs
          activeKey={selectedPlatform}
          onChange={setSelectedPlatform}
          items={tabItems}
        />
      </div>
    );
  }

  // 单平台游戏，直接渲染
  return (
    <div className="game-loader">
      {renderLoader(game.platform)}
    </div>
  );
};
```

#### 步骤 3.6: 集成到游戏播放页面

**文件**: `frontend/src/pages/Game/GamePlayer.tsx`

**修改现有的 GamePlayer 组件**:

```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { getGameById } from '@/services/api/games';
import { GameLoader } from '@/components/business/GameLoader';
import Loading from '@/components/common/Loading';

const GamePlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => {
    // 从 localStorage 获取或生成新的 session ID
    const stored = localStorage.getItem(`game_session_${id}`);
    return stored || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });

  useEffect(() => {
    const fetchGame = async () => {
      if (!id) {
        setError('游戏 ID 无效');
        setLoading(false);
        return;
      }

      try {
        const gameData = await getGameById(id);
        setGame(gameData);
        
        // 保存 session ID
        localStorage.setItem(`game_session_${id}`, sessionId);
      } catch (err: any) {
        console.error('Failed to fetch game:', err);
        setError(err.message || '加载游戏失败');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();

    // 清理函数
    return () => {
      // 可以在这里处理会话结束逻辑
    };
  }, [id, sessionId]);

  const handleExit = () => {
    // 清理 session
    localStorage.removeItem(`game_session_${id}`);
    navigate(`/games/${id}`);
  };

  const handleGameLoad = () => {
    console.log('Game loaded successfully');
  };

  const handleGameError = (error: Error) => {
    message.error('游戏加载失败：' + error.message);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading message="加载游戏中..." />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <p className="text-red-500">{error || '游戏不存在'}</p>
          <Button onClick={() => navigate('/games')}>返回游戏列表</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="game-player-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <div className="game-toolbar" style={{ padding: '8px 16px', backgroundColor: '#001529', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>{game.title}</strong>
        </div>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={handleExit}
          style={{ color: 'white' }}
        >
          退出游戏
        </Button>
      </div>

      {/* 游戏加载区域 */}
      <div className="game-container" style={{ flex: 1, overflow: 'hidden' }}>
        <GameLoader
          game={game}
          sessionId={sessionId}
          onLoad={handleGameLoad}
          onError={handleGameError}
        />
      </div>
    </div>
  );
};

export default GamePlayer;
```

---

### Phase 4: 测试与优化 (3天)

#### 测试清单

**单元测试**:
```bash
# 后端
cd backend
npm test -- platform-adapters
npm test -- game-platform.service

# 前端
cd frontend
npm test -- platform-detector
npm test -- GameLoader
```

**集成测试**:
- [ ] HTML5 游戏加载测试
- [ ] 微信小游戏启动测试
- [ ] 抖音小游戏启动测试
- [ ] 二维码生成测试
- [ ] 平台切换测试

**兼容性测试**:
- [ ] Chrome 浏览器
- [ ] Safari 浏览器
- [ ] 微信内置浏览器
- [ ] 抖音APP
- [ ] iOS 设备
- [ ] Android 设备

---

## 🔐 需求二：多平台第三方登录

### Phase 5: 后端 OAuth 实现 (1周)

#### 步骤 5.1: 扩展认证类型枚举

**文件**: `backend/src/modules/auth/entities/user-auth-method.entity.ts`

**修改 AuthType 枚举**:

```typescript
export enum AuthType {
  PHONE = 'phone',
  EMAIL = 'email',
  WECHAT = 'wechat',
  QQ = 'qq',
  APPLE = 'apple',
  ALIPAY = 'alipay',      // 新增：支付宝
  WEIBO = 'weibo',        // 新增：微博
  DOUYIN = 'douyin',      // 新增：抖音
  GOOGLE = 'google',      // 新增：Google
}
```

#### 步骤 5.2: 创建数据库迁移

**文件**: `backend/src/database/migrations/011_extend_auth_types.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendAuthTypes1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 如果使用 enum 类型，需要更新
    await queryRunner.query(`
      ALTER TYPE "user_auth_methods_auth_type_enum" 
      ADD VALUE IF NOT EXISTS 'alipay'
    `);
    
    await queryRunner.query(`
      ALTER TYPE "user_auth_methods_auth_type_enum" 
      ADD VALUE IF NOT EXISTS 'weibo'
    `);
    
    await queryRunner.query(`
      ALTER TYPE "user_auth_methods_auth_type_enum" 
      ADD VALUE IF NOT EXISTS 'douyin'
    `);
    
    await queryRunner.query(`
      ALTER TYPE "user_auth_methods_auth_type_enum" 
      ADD VALUE IF NOT EXISTS 'google'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL 不支持删除 enum 值
    // 如果需要回滚，需要重新创建 enum 类型
  }
}
```

#### 步骤 5.3: 创建 OAuth 接口定义

**文件**: `backend/src/modules/auth/interfaces/oauth-provider.interface.ts`

```typescript
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

export interface OAuthUserInfo {
  providerId: string;      // 第三方平台的用户ID
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'unknown';
  unionId?: string;        // 用于跨应用识别
  rawData: any;            // 原始数据
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
}

export interface IOAuthProvider {
  /**
   * 获取授权URL
   */
  getAuthorizationUrl(state: string): string;

  /**
   * 用授权码交换访问令牌
   */
  exchangeCode(code: string): Promise<OAuthTokens>;

  /**
   * 获取用户信息
   */
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;

  /**
   * 验证访问令牌是否有效
   */
  validateToken(accessToken: string): Promise<boolean>;

  /**
   * 刷新访问令牌（可选）
   */
  refreshToken?(refreshToken: string): Promise<OAuthTokens>;
}
```

#### 步骤 5.4: 实现各平台 OAuth Provider

由于代码较长，我会创建一个总结文档列出所有需要实现的文件：

**需要创建的 OAuth Provider 文件**:

1. `backend/src/modules/auth/providers/wechat-oauth.provider.ts`
2. `backend/src/modules/auth/providers/qq-oauth.provider.ts`
3. `backend/src/modules/auth/providers/alipay-oauth.provider.ts` ✨新增
4. `backend/src/modules/auth/providers/weibo-oauth.provider.ts` ✨新增
5. `backend/src/modules/auth/providers/douyin-oauth.provider.ts` ✨新增
6. `backend/src/modules/auth/providers/google-oauth.provider.ts` ✨新增
7. `backend/src/modules/auth/providers/apple-oauth.provider.ts`

每个 Provider 的实现结构类似，包含：
- 配置初始化
- `getAuthorizationUrl()` - 生成授权URL
- `exchangeCode()` - 交换 access_token
- `getUserInfo()` - 获取用户信息
- `validateToken()` - 验证token有效性

#### 步骤 5.5: 创建统一 OAuth 服务

**文件**: `backend/src/modules/auth/services/oauth.service.ts`

这个文件的完整实现请参考之前提供的详细代码。主要功能包括：

- 管理所有 OAuth Provider
- 处理OAuth回调
- 创建或关联用户账号
- 绑定/解绑第三方账号
- 生成JWT token

#### 步骤 5.6: 创建 OAuth 控制器

**文件**: `backend/src/modules/auth/controllers/oauth.controller.ts`

```typescript
import { Controller, Get, Post, Query, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { OAuthService } from '../services/oauth.service';
import { AuthType } from '../entities/user-auth-method.entity';

@Controller('auth/oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  /**
   * 获取OAuth授权URL
   * GET /auth/oauth/:provider/url
   */
  @Get(':provider/url')
  async getAuthUrl(
    @Param('provider') provider: string,
    @Query('state') state: string,
    @Query('redirect_uri') redirectUri?: string,
  ) {
    const authType = provider.toUpperCase() as AuthType;
    
    const url = await this.oauthService.getAuthorizationUrl(authType, state);
    
    return {
      url,
      provider: authType,
      state,
    };
  }

  /**
   * 处理OAuth回调
   * POST /auth/oauth/:provider/callback
   */
  @Post(':provider/callback')
  async handleCallback(
    @Param('provider') provider: string,
    @Body() body: { code: string; state: string },
    @Res() res: Response,
  ) {
    try {
      const authType = provider.toUpperCase() as AuthType;
      
      const result = await this.oauthService.handleCallback(
        authType,
        body.code,
        body.state,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        user: result.user,
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 绑定第三方账号
   * POST /auth/oauth/:provider/bind
   */
  @Post(':provider/bind')
  async bindAccount(
    @Param('provider') provider: string,
    @Body() body: { code: string; user_id: string },
  ) {
    const authType = provider.toUpperCase() as AuthType;
    
    await this.oauthService.bindOAuthAccount(
      body.user_id,
      authType,
      body.code,
    );

    return {
      success: true,
      message: '绑定成功',
    };
  }

  /**
   * 解绑第三方账号
   * DELETE /auth/oauth/:provider/unbind
   */
  @Delete(':provider/unbind')
  async unbindAccount(
    @Param('provider') provider: string,
    @Body() body: { user_id: string },
  ) {
    const authType = provider.toUpperCase() as AuthType;
    
    await this.oauthService.unbindOAuthAccount(body.user_id, authType);

    return {
      success: true,
      message: '解绑成功',
    };
  }
}
```

#### 步骤 5.7: 配置环境变量

**文件**: `backend/.env.example`

**添加OAuth配置**:

```bash
# 微信登录
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=https://yourdomain.com/auth/callback/wechat

# QQ登录
QQ_APP_ID=your_qq_app_id
QQ_APP_KEY=your_qq_app_key
QQ_REDIRECT_URI=https://yourdomain.com/auth/callback/qq

# 支付宝登录
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_alipay_private_key
ALIPAY_PUBLIC_KEY=alipay_public_key
ALIPAY_REDIRECT_URI=https://yourdomain.com/auth/callback/alipay

# 微博登录
WEIBO_APP_KEY=your_weibo_app_key
WEIBO_APP_SECRET=your_weibo_app_secret
WEIBO_REDIRECT_URI=https://yourdomain.com/auth/callback/weibo

# 抖音登录
DOUYIN_CLIENT_KEY=your_douyin_client_key
DOUYIN_CLIENT_SECRET=your_douyin_client_secret
DOUYIN_REDIRECT_URI=https://yourdomain.com/auth/callback/douyin

# Google登录
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback/google

# Apple登录
APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY_PATH=./keys/apple-private-key.p8
APPLE_REDIRECT_URI=https://yourdomain.com/auth/callback/apple
```

---

### Phase 6: 前端第三方登录实现 (1周)

#### 步骤 6.1: 创建社交登录按钮组件

**文件**: `frontend/src/components/auth/SocialLoginButtons.tsx`

完整代码见之前提供的详细实现，包含所有7种登录方式的按钮。

#### 步骤 6.2: 创建 OAuth 回调处理页面

**文件**: `frontend/src/pages/Auth/OAuthCallback.tsx`

完整代码见之前提供的详细实现。

#### 步骤 6.3: 添加路由配置

**文件**: `frontend/src/App.tsx`

**添加OAuth回调路由**:

```typescript
import { OAuthCallback } from '@/pages/Auth/OAuthCallback';

// 在 Routes 中添加
<Route path="/auth/callback/:provider" element={<OAuthCallback />} />
```

#### 步骤 6.4: 集成到登录页面

**文件**: `frontend/src/pages/Auth/LoginPage.tsx`

```typescript
import React from 'react';
import { Card, Divider } from 'antd';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { LoginForm } from '@/components/auth/LoginForm'; // 假设已存在

const LoginPage: React.FC = () => {
  return (
    <div className="login-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card style={{ width: 400 }}>
        <h2 style={{ textAlign: 'center' }}>登录</h2>
        
        {/* 传统登录表单 */}
        <LoginForm />
        
        <Divider>或使用第三方登录</Divider>
        
        {/* 第三方登录按钮 */}
        <SocialLoginButtons />
      </Card>
    </div>
  );
};

export default LoginPage;
```

---

### Phase 7: 测试与优化 (3天)

#### 测试清单

**功能测试**:
- [ ] 每个平台的OAuth授权流程
- [ ] 用户信息获取
- [ ] 新用户注册
- [ ] 已有用户登录
- [ ] 账号绑定功能
- [ ] 账号解绑功能

**安全测试**:
- [ ] State参数验证（防CSRF）
- [ ] Token安全存储
- [ ] API接口鉴权
- [ ] 敏感信息加密

**兼容性测试**:
- [ ] 各浏览器兼容性
- [ ] 移动端适配
- [ ] 微信内置浏览器
- [ ] 各平台APP内

---

### Phase 8: 集成测试与上线准备 (3天)

#### 准备工作

1. **配置生产环境**
   - 配置正式的OAuth回调域名
   - 申请各平台的生产环境应用
   - 配置HTTPS证书

2. **数据迁移**
   - 运行所有数据库迁移
   - 验证数据完整性

3. **性能优化**
   - 添加Redis缓存OAuth token
   - 优化数据库查询
   - 添加CDN加速

4. **监控告警**
   - 配置日志收集
   - 配置错误告警
   - 配置性能监控

---

## 📝 注意事项

### 开发注意事项

1. **OAuth安全**
   - 始终验证 state 参数
   - 使用 HTTPS
   - 不在前端暴露 client_secret
   - 实现token刷新机制

2. **平台差异**
   - 不同平台的授权流程略有差异
   - 注意用户信息字段的差异
   - 处理好平台特有的错误码

3. **用户体验**
   - 提供清晰的错误提示
   - 支持取消授权
   - 记住用户的登录选择

4. **数据隐私**
   - 遵守各平台的数据使用规范
   - 获得用户授权才能使用数据
   - 提供数据删除功能

### 运维注意事项

1. **监控指标**
   - OAuth授权成功率
   - 各平台登录占比
   - 错误率和响应时间
   - Token刷新频率

2. **应急预案**
   - 某个平台服务异常的降级方案
   - 快速回滚机制
   - 用户数据备份策略

3. **文档维护**
   - 更新API文档
   - 记录各平台的特殊处理
   - 维护故障处理手册

---

## 🎯 验收标准

### 功能验收

- [ ] 支持HTML5、微信、抖音三种游戏平台
- [ ] 支持7种第三方登录方式
- [ ] 游戏启动成功率 > 95%
- [ ] OAuth授权成功率 > 98%
- [ ] 支持平台自动检测
- [ ] 支持多平台游戏切换
- [ ] 支持账号绑定/解绑

### 性能验收

- [ ] 游戏加载时间 < 3秒
- [ ] OAuth跳转延迟 < 500ms
- [ ] API响应时间 < 200ms
- [ ] 二维码生成时间 < 1秒

### 安全验收

- [ ] 通过安全扫描
- [ ] CSRF防护有效
- [ ] Token安全存储
- [ ] 无敏感信息泄露

---

## 📚 相关文档

- [微信开放平台文档](https://developers.weixin.qq.com/doc/)
- [抖音开放平台文档](https://developer.open-douyin.com/)
- [支付宝开放平台文档](https://opendocs.alipay.com/)
- [微博开放平台文档](https://open.weibo.com/wiki/首页)
- [Google OAuth文档](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In文档](https://developer.apple.com/sign-in-with-apple/)

---

## 🆘 问题反馈

如遇到问题，请按以下格式提供信息：

1. **问题描述**：详细描述遇到的问题
2. **复现步骤**：如何重现问题
3. **错误信息**：完整的错误日志
4. **环境信息**：操作系统、浏览器版本等
5. **截图**：如有必要，提供截图

---

**文档维护者**: GameHub 开发团队  
**最后更新**: 2024-11-12  
**版本**: v1.0

