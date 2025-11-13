/**
 * 游戏统计服务
 * Game Statistics Service
 *
 * 处理游戏统计数据的并发安全更新
 * Handle concurrent-safe game statistics updates
 */
import { getGameRepository } from '@/services/repository.service';
import { Game } from '@/modules/games/entities/game.entity';
import { logger } from '@/utils/logger';
import { DatabaseError } from '@/middleware';
import {
  transactionService,
  concurrencyService,
  Transactional,
  HighConcurrency,
  type TransactionContext
} from '@/services/database';
import { AuditLogService } from '@/modules/audit/services/audit-log.service';
import { AuditEventType } from '@/modules/audit/entities/audit-log.entity';

export interface GameStatsUpdate {
  gameId: string;
  playCount?: number;
  rating?: number;
  totalRatings?: number;
  averageRating?: number;
}

export class GameStatsService {
  private gameRepository = getGameRepository();

  /**
   * 增加游戏播放次数（高并发安全）
   * Increment game play count (high concurrency safe)
   */
  @HighConcurrency()
  async incrementPlayCount(
    gameId: string,
    increment: number = 1,
    context?: TransactionContext
  ): Promise<number> {
    const manager = context?.manager || this.gameRepository.manager;

    try {
      return await concurrencyService.withDistributedLock(
        `game:${gameId}:playcount`,
        async () => {
          // 使用悲观锁查询游戏
          const game = await manager
            .createQueryBuilder(Game, 'game')
            .where('game.id = :gameId', { gameId })
            .setLock('pessimistic_write')
            .getOne();

          if (!game) {
            throw new Error('游戏不存在');
          }

          // 计算新播放次数
          const newPlayCount = game.playCount + increment;

          // 更新游戏播放次数
          await manager.update(Game, { id: gameId }, { playCount: newPlayCount });

          logger.debug('Game play count incremented', {
            gameId,
            oldCount: game.playCount,
            newCount: newPlayCount,
            increment,
          });

          // 记录游戏播放审计事件
          // Record game play audit event
          try {
            const auditService = new (await import('@/modules/audit/services/audit-log.service')).AuditLogService(manager.connection);
            await auditService.logSystemEvent(
              AuditEventType.GAME_PLAY,
              `游戏《${game.title || gameId}》播放次数增加 ${increment}，总播放次数：${newPlayCount}`,
              {
                metadata: {
                  increment,
                  gameTitle: game.title,
                  totalPlayCount: newPlayCount,
                  resourceId: gameId,
                  resourceType: 'game',
                  oldValues: { playCount: game.playCount },
                  newValues: { playCount: newPlayCount }
                }
              }
            );
          } catch (auditError) {
            // 审计日志失败不影响主要业务流程
            logger.warn('Failed to log game play audit:', auditError);
          }

          return newPlayCount;
        },
        { ttl: 5 } // 5秒锁超时
      );
    } catch (error) {
      logger.error('Failed to increment play count:', error as Error);
      throw new DatabaseError('更新游戏播放次数失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 批量增加多个游戏的播放次数
   * Batch increment play counts for multiple games
   */
  @Transactional()
  async batchIncrementPlayCounts(
    updates: Array<{ gameId: string; increment: number }>,
    context: TransactionContext
  ): Promise<Array<{ gameId: string; newCount: number; success: boolean }>> {
    const results: Array<{ gameId: string; newCount: number; success: boolean }> = [];

    try {
      for (const update of updates) {
        try {
          const newCount = await this.incrementPlayCount(
            update.gameId,
            update.increment,
            context
          );

          results.push({
            gameId: update.gameId,
            newCount,
            success: true,
          });
        } catch (error) {
          logger.error(`Failed to increment play count for game ${update.gameId}:`, error as Error);
          results.push({
            gameId: update.gameId,
            newCount: 0,
            success: false,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to execute batch play count increment:', error as Error);
      throw new DatabaseError('批量更新游戏播放次数失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 更新游戏评分（并发安全）
   * Update game rating (thread-safe)
   */
  @HighConcurrency()
  async updateRating(
    gameId: string,
    newRating: number,
    context?: TransactionContext
  ): Promise<{ averageRating: number; totalRatings: number }> {
    if (newRating < 1 || newRating > 5) {
      throw new Error('评分必须在1-5之间');
    }

    const manager = context?.manager || this.gameRepository.manager;

    try {
      return await concurrencyService.withDistributedLock(
        `game:${gameId}:rating`,
        async () => {
          // 查询当前游戏统计（悲观锁）
          const game = await manager
            .createQueryBuilder(Game, 'game')
            .where('game.id = :gameId', { gameId })
            .setLock('pessimistic_write')
            .getOne();

          if (!game) {
            throw new Error('游戏不存在');
          }

          // 计算新的平均评分
          // 这里简化处理，实际应该有专门的评分表
          const currentAverage = game.averageRating || 0;
          const totalRatings = 1; // 这里应该从评分表获取总数

          // 简化的评分计算（实际应该更复杂）
          const newAverageRating = (currentAverage + newRating) / 2;

          // 更新游戏评分
          await manager.update(Game, { id: gameId }, {
            averageRating: Math.round(newAverageRating * 100) / 100, // 保留两位小数
          });

          logger.debug('Game rating updated', {
            gameId,
            oldRating: currentAverage,
            newRating: newAverageRating,
            userRating: newRating,
          });

          return {
            averageRating: newAverageRating,
            totalRatings,
          };
        },
        { ttl: 5 }
      );
    } catch (error) {
      logger.error('Failed to update game rating:', error as Error);
      throw new DatabaseError('更新游戏评分失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 获取游戏统计信息
   * Get game statistics
   */
  async getGameStats(gameId: string): Promise<{
    playCount: number;
    averageRating: number | null;
    ratingCount: number;
  }> {
    try {
      const game = await this.gameRepository.findOne({
        where: { id: gameId },
        select: ['id', 'playCount', 'averageRating'],
      });

      if (!game) {
        throw new Error('游戏不存在');
      }

      return {
        playCount: game.playCount,
        averageRating: game.averageRating,
        ratingCount: 0, // 这里应该从评分表获取
      };
    } catch (error) {
      logger.error('Failed to get game stats:', error as Error);
      throw new DatabaseError('获取游戏统计信息失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 重置游戏统计数据（仅管理员使用）
   * Reset game statistics (admin only)
   */
  @Transactional()
  async resetGameStats(
    gameId: string,
    context: TransactionContext
  ): Promise<void> {
    try {
      await context.manager.update(Game, { id: gameId }, {
        playCount: 0,
        averageRating: null,
      });

      logger.warn('Game statistics reset', { gameId });
    } catch (error) {
      logger.error('Failed to reset game stats:', error as Error);
      throw new DatabaseError('重置游戏统计数据失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 获取热门游戏排行榜（基于播放次数）
   * Get popular games ranking (based on play count)
   */
  async getPopularGames(limit: number = 10): Promise<Game[]> {
    try {
      return await this.gameRepository.find({
        order: { playCount: 'DESC' },
        take: limit,
        select: ['id', 'title', 'playCount', 'averageRating'],
      });
    } catch (error) {
      logger.error('Failed to get popular games:', error as Error);
      throw new DatabaseError('获取热门游戏排行榜失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 获取高评分游戏排行榜
   * Get high-rated games ranking
   */
  async getTopRatedGames(limit: number = 10): Promise<Game[]> {
    try {
      return await this.gameRepository
        .createQueryBuilder('game')
        .where('game.averageRating IS NOT NULL')
        .orderBy('game.averageRating', 'DESC')
        .take(limit)
        .select(['game.id', 'game.title', 'game.averageRating'])
        .getMany();
    } catch (error) {
      logger.error('Failed to get top rated games:', error as Error);
      throw new DatabaseError('获取高评分游戏排行榜失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 记录游戏会话
   * Record game session
   */
  @Transactional()
  async recordGameSession(
    gameId: string,
    userId: string,
    durationSeconds: number,
    pointsEarned: number,
    context: TransactionContext
  ): Promise<void> {
    try {
      // 增加游戏播放次数
      await this.incrementPlayCount(gameId, 1, context);

      // 如果用户获得了积分，更新用户积分
      if (pointsEarned > 0) {
        const { pointsService } = await import('./points.service');
        await pointsService.addPoints(
          userId,
          pointsEarned,
          `游戏《${gameId}》奖励`,
          `game_session:${gameId}:${Date.now()}`,
          context
        );
      }

      logger.info('Game session recorded', {
        gameId,
        userId,
        durationSeconds,
        pointsEarned,
      });
    } catch (error) {
      logger.error('Failed to record game session:', error as Error);
      throw new DatabaseError('记录游戏会话失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 并发安全的游戏数据更新
   * Concurrent-safe game data update
   */
  @HighConcurrency()
  async updateGameStats(
    gameId: string,
    updates: Partial<GameStatsUpdate>,
    context?: TransactionContext
  ): Promise<Game> {
    const manager = context?.manager || this.gameRepository.manager;

    try {
      return await concurrencyService.withDistributedLock(
        `game:${gameId}:stats`,
        async () => {
          const game = await manager
            .createQueryBuilder(Game, 'game')
            .where('game.id = :gameId', { gameId })
            .setLock('pessimistic_write')
            .getOne();

          if (!game) {
            throw new Error('游戏不存在');
          }

          const updateData: Partial<Game> = {};

          // 更新播放次数
          if (updates.playCount !== undefined) {
            updateData.playCount = updates.playCount;
          }

          // 更新评分
          if (updates.averageRating !== undefined) {
            updateData.averageRating = updates.averageRating;
          }

          if (Object.keys(updateData).length > 0) {
            await manager.update(Game, { id: gameId }, updateData);
          }

          // 返回更新后的游戏数据
          const updatedGame = await manager.findOne(Game, { where: { id: gameId } });
          if (!updatedGame) {
            throw new Error('更新后无法找到游戏数据');
          }
          return updatedGame;
        },
        { ttl: 5 }
      );
    } catch (error) {
      logger.error('Failed to update game stats:', error as Error);
      throw new DatabaseError('更新游戏统计数据失败', { originalError: (error as Error).message });
    }
  }
}

// 导出单例
export const gameStatsService = new GameStatsService();

