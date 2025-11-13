/**
 * 添加测试游戏数据
 * Add Test Game Data
 * 
 * 
 * 
 * 手动添加测试游戏
 * cd packages/backend
 * npx npx ts-node src/scripts/add-test-games.ts
 * 
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { GameAggregationService } from '../services/gameAggregation.service';

async function addTestGames() {
  console.log('🎮 添加测试游戏数据...');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const gameService = app.get(GameAggregationService);
    
    // 创建测试游戏数据
    const testGames = [
      {
        title: '2048',
        description: '经典的数字拼图游戏，将相同数字的方块合并，目标是达到2048。',
        genre: ['益智', '休闲'],
        platform: ['Web', 'Mobile'],
        coverImage: 'https://play-lh.googleusercontent.com/2048.png',
        screenshots: [],
        version: '1.0.0',
        developer: 'Gabriele Cirulli',
        releaseDate: new Date('2014-03-09'),
        rating: 4.5,
        tags: ['数字', '益智', '简单'],
        source: 'RAWG' as const,
        sourceId: 'test_2048',
        sourceUrl: 'https://play2048.co/',
      },
      {
        title: 'Tetris',
        description: '经典的俄罗斯方块游戏，通过旋转和移动不同形状的方块来填满行。',
        genre: ['动作', '益智'],
        platform: ['Web', 'Mobile'],
        coverImage: 'https://tetris.com/tetris-logo.png',
        screenshots: [],
        version: '1.0.0',
        developer: 'Tetris Company',
        releaseDate: new Date('1984-06-06'),
        rating: 4.8,
        tags: ['经典', '方块', '策略'],
        source: 'RAWG' as const,
        sourceId: 'test_tetris',
        sourceUrl: 'https://tetris.com/play-tetris',
      },
      {
        title: 'Snake Game',
        description: '经典的贪吃蛇游戏，控制蛇吃食物并避免撞到自己。',
        genre: ['动作', '休闲'],
        platform: ['Web'],
        coverImage: 'https://snake-game.png',
        screenshots: [],
        version: '1.0.0',
        developer: 'Classic Games',
        releaseDate: new Date('1976-01-01'),
        rating: 4.2,
        tags: ['经典', '简单', '上瘾'],
        source: 'ITCH' as const,
        sourceId: 'test_snake',
        sourceUrl: 'https://snake-game.io/',
      },
    ];
    
    // 保存测试游戏
    const savedCount = await gameService.saveGames(testGames);
    console.log(`✅ 成功添加 ${savedCount} 款测试游戏`);
    
    await app.close();
    
  } catch (error) {
    console.error('❌ 添加测试游戏失败:', error);
    process.exit(1);
  }
}

addTestGames().catch(console.error);
