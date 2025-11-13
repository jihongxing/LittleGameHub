/**
 * Simplified GameHub Application Module
 * 简化的 GameHub 应用程序模块
 * 
 * This is a simplified version of the root module that includes only
 * the essential components needed for basic functionality.
 * 
 * 这是根模块的简化版本，仅包含基本功能所需的核心组件。
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'

/**
 * Simplified Application Module
 * 简化的应用程序模块
 * 
 * This module provides basic application functionality without
 * complex database connections or external dependencies.
 * 
 * 此模块提供基本的应用程序功能，不包含复杂的数据库连接或外部依赖项。
 */
@Module({
  imports: [
    // Global Configuration Module - 全局配置模块
    ConfigModule.forRoot({
      isGlobal: true,        // Make config available globally - 使配置全局可用
      envFilePath: '.env',   // Environment file path - 环境文件路径
    }),
  ],

  // Root Controllers - 根控制器
  controllers: [AppController],

  // Root Providers - 根提供者
  providers: [AppService],
})
export class AppModule {}
