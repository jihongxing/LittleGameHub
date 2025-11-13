/**
 * Games Module
 * 游戏模块
 * 
 * This module encapsulates all game-related functionality including game management,
 * game sessions, and game metadata handling. It provides services and controllers
 * for managing the core gaming features of the GameHub platform.
 * 
 * 此模块封装了所有与游戏相关的功能，包括游戏管理、游戏会话和游戏元数据处理。
 * 它为管理 GameHub 平台的核心游戏功能提供服务和控制器。
 * 
 * Key features:
 * - Game catalog management
 * - Game session tracking
 * - Game metadata and statistics
 * - Game discovery and search
 * - Game rating and reviews
 * 
 * 主要功能：
 * - 游戏目录管理
 * - 游戏会话跟踪
 * - 游戏元数据和统计
 * - 游戏发现和搜索
 * - 游戏评分和评论
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { GameSession } from './entities/game-session.entity';
import { GameService } from './services/game.service';
import { GameSessionService } from './services/game-session.service';
import { GamesController } from './controllers/games.controller';
import { AuthModule } from '../auth/auth.module';
import { GameAggregationService } from '../../services/gameAggregation.service';
import { SyncGamesTask } from '../../tasks/syncGames.task';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, GameSession]),
    AuthModule, // 导入AuthModule以提供JwtService给JwtAuthGuard
  ],
  controllers: [GamesController],
  providers: [GameService, GameSessionService, GameAggregationService, SyncGamesTask],
  exports: [GameService, GameSessionService, GameAggregationService, SyncGamesTask],
})
export class GamesModule {}
