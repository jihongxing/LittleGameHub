/**
 * GameHub Application Root Module
 * GameHub 应用程序根模块
 * 
 * This is the root module of the GameHub NestJS application that orchestrates
 * all feature modules, configurations, and dependencies. It serves as the main
 * entry point for the dependency injection container and module system.
 * 
 * 这是 GameHub NestJS 应用程序的根模块，负责协调所有功能模块、
 * 配置和依赖项。它作为依赖注入容器和模块系统的主要入口点。
 * 
 * Key responsibilities:
 * - Configure global modules (Config, Database)
 * - Import and organize feature modules
 * - Provide root-level services and controllers
 * - Manage application-wide dependencies
 * 
 * 主要职责：
 * - 配置全局模块（配置、数据库）
 * - 导入和组织功能模块
 * - 提供根级服务和控制器
 * - 管理应用程序范围的依赖项
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 * 
 * TODO: Migrate Express routes to NestJS modules:
 * 待办：将 Express 路由迁移到 NestJS 模块：
 * - auth -> AuthModule (认证模块)
 * - users -> UsersModule (用户模块)
 * - games -> GamesModule (游戏模块)
 * - downloads -> DownloadsModule (下载模块)
 * - favorites -> FavoritesModule (收藏模块)
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature Modules - 功能模块
import { GamesModule } from './modules/games/games.module';
import { PointsModule } from './modules/points/points.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { MembershipModule } from './modules/membership/membership.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { SocialModule } from './modules/social/social.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { OfflineModule } from './modules/offline/offline.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { AuditModule } from './modules/audit/audit.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { AuthModule } from './modules/auth/auth.module';

// Configuration - 配置
import { getTypeOrmConfig } from './config/database.config';

/**
 * Root Application Module
 * 根应用程序模块
 * 
 * This decorator defines the module metadata including:
 * - imports: External modules to be imported
 * - controllers: Controllers belonging to this module
 * - providers: Services and providers available in this module
 * 
 * 此装饰器定义模块元数据，包括：
 * - imports: 要导入的外部模块
 * - controllers: 属于此模块的控制器
 * - providers: 此模块中可用的服务和提供者
 */
@Module({
  imports: [
    // Global Configuration Module - 全局配置模块
    // Provides environment variables and configuration across the app
    // 在整个应用程序中提供环境变量和配置
    ConfigModule.forRoot({
      isGlobal: true,        // Make config available globally - 使配置全局可用
    }),

    // Database Module - 数据库模块
    // Configures TypeORM with PostgreSQL database connection
    // 使用 PostgreSQL 数据库连接配置 TypeORM
    TypeOrmModule.forRoot(getTypeOrmConfig()),

    // Feature Modules - 功能模块
    // Each module handles a specific domain of the application
    // 每个模块处理应用程序的特定领域

    AuthModule,               // Authentication and authorization - 认证和授权
    GamesModule,              // Game management - 游戏管理
    PointsModule,             // Points and rewards system - 积分和奖励系统
    OfflineModule,            // Offline game management - 离线游戏管理
    AchievementsModule,       // Achievement system - 成就系统
    AuditModule,              // Audit logging system - 审计日志系统
    FileUploadModule,         // Secure file upload system - 安全文件上传系统
    RewardsModule,            // Rewards system - 奖励系统
    MembershipModule,         // Membership system - 会员系统
    InvitationsModule,        // Invitations system - 邀请系统
    RecommendationsModule,    // Recommendations system - 推荐系统
    CollectionsModule,        // Collections system - 收藏系统
    SocialModule,             // Social features - 社交功能

    // TODO: Add more feature modules here
    // 待办：在此处添加更多功能模块
    // UsersModule,           // User management - 用户管理
    // NotificationsModule,   // Push notifications - 推送通知
    // AnalyticsModule,       // Analytics and tracking - 分析和跟踪
  ],

  // Root Controllers - 根控制器
  // Controllers that handle application-level routes
  // 处理应用程序级路由的控制器
  controllers: [AppController],

  // Root Providers - 根提供者
  // Services available at the application root level
  // 在应用程序根级别可用的服务
  providers: [AppService],
})
export class AppModule {}
