import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GameAggregationService } from '../services/gameAggregation.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// 临时接口，实际使用时应导入真实的Game实体
interface Game {
  id: string;
  source: string;
  sourceId: string;
  sourceUrl: string;
  title: string;
  description: string;
  coverUrl: string;
  rating: number;
  genres: string[];
  platforms: string[];
  releaseDate: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

@Injectable()
export class SyncGamesTask implements OnModuleInit {
  private readonly logger = new Logger(SyncGamesTask.name);
  private syncInterval: NodeJS.Timeout;

  constructor(
    private gameAggregationService: GameAggregationService,
    @InjectRepository('Game')
    private gameRepository: Repository<Game>,
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
   */
  async syncGames() {
    this.logger.log('🔄 开始同步游戏数据...');
    const startTime = Date.now();

    try {
      // 1. 聚合游戏
      let games = await this.gameAggregationService.aggregateAllGames(5000);
      this.logger.log(`📥 聚合了 ${games.length} 款游戏`);

      // 2. 去重
      games = this.gameAggregationService.deduplicateGames(games);
      this.logger.log(`🔄 去重后 ${games.length} 款游戏`);

      // 3. 过滤
      games = this.gameAggregationService.filterGames(games);
      this.logger.log(`✅ 过滤后 ${games.length} 款游戏`);

      // 4. 保存到数据库
      await this.upsertGames(games);
      this.logger.log(`💾 成功保存到数据库`);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`✨ 游戏同步完成！耗时 ${duration} 秒`);
    } catch (error) {
      this.logger.error('❌ 游戏同步失败:', error);
    }
  }

  /**
   * 手动触发同步（用于测试）
   */
  async manualSync() {
    this.logger.log('🔄 手动触发游戏同步...');
    await this.syncGames();
  }

  /**
   * 批量插入或更新游戏
   */
  private async upsertGames(games: any[]) {
    for (const game of games) {
      // 检查游戏是否已存在
      const existing = await this.gameRepository.findOne({
        where: {
          source: game.source,
          sourceId: game.sourceId,
        },
      });

      if (existing) {
        // 更新现有游戏
        await this.gameRepository.update(
          { id: existing.id },
          {
            title: game.title,
            description: game.description,
            coverUrl: game.coverUrl,
            rating: game.rating,
            genres: game.genres,
            platforms: game.platforms,
            releaseDate: game.releaseDate,
            updatedAt: new Date(),
          }
        );
      } else {
        // 创建新游戏
        const newGame = this.gameRepository.create({
          source: game.source,
          sourceId: game.sourceId,
          sourceUrl: `${this.buildSourceUrl(game.source)}/${game.sourceId}`,
          title: game.title,
          description: game.description,
          coverUrl: game.coverUrl,
          rating: game.rating,
          genres: game.genres,
          platforms: game.platforms,
          releaseDate: game.releaseDate,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await this.gameRepository.save(newGame);
      }
    }

    this.logger.log(`✅ 成功处理 ${games.length} 款游戏`);
  }

  /**
   * 构建原始游戏链接
   */
  private buildSourceUrl(source: string): string {
    const urls: Record<string, string> = {
      rawg: 'https://rawg.io/games',
      itch: 'https://itch.io/games',
      igdb: 'https://www.igdb.com/games',
      wechat: 'https://minigame.qq.com/game',
      douyin: 'https://www.douyin.com/game',
    };
    return urls[source] || '';
  }
}
