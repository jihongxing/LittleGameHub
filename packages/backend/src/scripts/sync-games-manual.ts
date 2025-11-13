/**
 * 手动同步游戏脚本
 * Manual Game Sync Script
 * 
 * 用于手动触发游戏数据同步，添加测试数据
 * Used to manually trigger game data synchronization and add test data
 * 
 * cd packages/backend
 * npx npx ts-node src/scripts/sync-games-manual.ts
 * 手动拉取游戏然后存储再数据库中
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SyncGamesTask } from '../tasks/syncGames.task';

async function main() {
  console.log('🚀 启动手动游戏同步...');
  
  try {
    // 创建NestJS应用
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // 获取同步任务服务
    const syncTask = app.get(SyncGamesTask);
    
    // 执行手动同步
    console.log('📥 开始同步游戏数据...');
    await syncTask.manualSync();
    
    console.log('✅ 游戏同步完成！');
    
    // 关闭应用
    await app.close();
    
  } catch (error) {
    console.error('❌ 游戏同步失败:', error);
    process.exit(1);
  }
}

// 运行脚本
main().catch(console.error);
