import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GameAggregationService } from '../services/gameAggregation.service';

/**
 * 游戏同步定时任务
 * Game Synchronization Scheduled Task
 * 
 * 每天凌晨2点自动从多个平台聚合游戏数据
 * Automatically aggregates game data from multiple platforms at 2 AM daily
 */
@Injectable()
export class SyncGamesTask implements OnModuleInit {
  private readonly logger = new Logger(SyncGamesTask.name);
  private syncInterval: NodeJS.Timeout;

  constructor(
    private readonly gameAggregationService: GameAggregationService,
  ) {}

  /**
   * 模块初始化时启动定时任务
   */
  onModuleInit() {
    this.startScheduledSync();
  }

  /**
   * 启动定时同步任务（每天凌晨2点）
   */
  private startScheduledSync() {
    // 计算下一次执行时间（凌晨2点）
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0);

    const delay = tomorrow.getTime() - now.getTime();
    
    // 第一次延迟执行
    setTimeout(() => {
      this.syncGames();
      // 之后每24小时执行一次
      this.syncInterval = setInterval(() => {
        this.syncGames();
      }, 24 * 60 * 60 * 1000);
    }, delay);

    this.logger.log(`✅ 定时同步任务已启动，下次执行时间：${tomorrow.toLocaleString()}`);
  }

  /**
   * 游戏同步主方法
   * Main game synchronization method
   * 
   * 流程：
   * 1. 从RAWG、Itch.io、IGDB聚合游戏
   * 2. 去重处理
   * 3. 过滤不适当内容
   * 4. 保存到数据库
   */
  async syncGames() {
    this.logger.log('🔄 开始同步游戏数据...');
    const startTime = Date.now();

    try {
      // 1. 聚合游戏（从RAWG、Itch.io、IGDB）
      this.logger.log('📥 正在聚合游戏数据...');
      let games = await this.gameAggregationService.aggregateAllGames(5000);
      this.logger.log(`✅ 聚合了 ${games.length} 款游戏`);

      // 2. 去重
      this.logger.log('🔄 正在去重...');
      games = this.gameAggregationService.deduplicateGames(games);
      this.logger.log(`✅ 去重后 ${games.length} 款游戏`);

      // 3. 过滤不适当的游戏
      this.logger.log('🔍 正在过滤...');
      games = this.gameAggregationService.filterGames(games);
      this.logger.log(`✅ 过滤后 ${games.length} 款游戏`);

      // 4. 保存到数据库（使用GameAggregationService的saveGames方法）
      this.logger.log('💾 正在保存到数据库...');
      const savedCount = await this.gameAggregationService.saveGames(games);
      this.logger.log(`✅ 成功保存 ${savedCount} 款游戏`);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`✨ 游戏同步完成！耗时 ${duration} 秒`);
      
      // 记录统计信息
      this.logger.log(`📊 本次同步统计：`);
      this.logger.log(`   - 聚合游戏数：${games.length}`);
      this.logger.log(`   - 保存游戏数：${savedCount}`);
      this.logger.log(`   - 耗时：${duration}秒`);
    } catch (error) {
      this.logger.error('❌ 游戏同步失败:', error);
      this.logger.error('错误详情:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 手动触发同步（用于测试）
   * Manual trigger for synchronization (for testing)
   * 
   * 使用示例：
   * const syncTask = app.get(SyncGamesTask);
   * await syncTask.manualSync();
   */
  async manualSync() {
    this.logger.log('🔄 手动触发游戏同步...');
    await this.syncGames();
  }

  /**
   * 销毁定时任务（应用关闭时调用）
   * Destroy scheduled task (call when application shuts down)
   */
  onDestroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.logger.log('✅ 定时同步任务已停止');
    }
  }
}
