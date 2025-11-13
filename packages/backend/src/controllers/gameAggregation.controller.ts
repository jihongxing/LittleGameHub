import { Controller, Get, Post, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { GameAggregationService } from '../services/gameAggregation.service';

@Controller('api/games')
export class GameAggregationController {
  private readonly logger = new Logger(GameAggregationController.name);

  constructor(private gameAggregationService: GameAggregationService) {}

  /**
   * 获取游戏列表
   * GET /api/games?page=1&limit=20&source=rawg&platform=Web
   */
  @Get()
  async getGames(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('source') source?: string,
    @Query('platform') platform?: string,
  ) {
    try {
      this.logger.log(`获取游戏列表: page=${page}, limit=${limit}, source=${source}, platform=${platform}`);
      
      // TODO: 从数据库查询游戏
      // 这里应该调用GameRepository查询
      
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      };
    } catch (error) {
      this.logger.error('获取游戏列表失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 获取游戏详情
   * GET /api/games/:id
   */
  @Get(':id')
  async getGameById(@Param('id') id: string) {
    try {
      this.logger.log(`获取游戏详情: id=${id}`);
      
      // TODO: 从数据库查询单个游戏
      
      return { error: '游戏不存在' };
    } catch (error) {
      this.logger.error('获取游戏详情失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 搜索游戏
   * GET /api/games/search/:keyword
   */
  @Get('search/:keyword')
  async searchGames(@Param('keyword') keyword: string) {
    try {
      this.logger.log(`搜索游戏: keyword=${keyword}`);
      
      // TODO: 从数据库搜索游戏
      
      return [];
    } catch (error) {
      this.logger.error('搜索游戏失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 按来源获取游戏
   * GET /api/games/source/:source
   */
  @Get('source/:source')
  async getGamesBySource(@Param('source') source: string) {
    try {
      this.logger.log(`按来源获取游戏: source=${source}`);
      
      // TODO: 从数据库查询指定来源的游戏
      
      return {
        source,
        count: 0,
        games: [],
      };
    } catch (error) {
      this.logger.error('按来源获取游戏失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 手动触发游戏同步（仅管理员）
   * POST /api/admin/sync-games
   */
  @Post('admin/sync-games')
  async syncGames() {
    try {
      this.logger.log('手动触发游戏同步...');
      
      // 异步执行同步，不阻塞响应
      setImmediate(async () => {
        const games = await this.gameAggregationService.aggregateAllGames(10000);
        const filtered = this.gameAggregationService.filterGames(games);
        
        // TODO: 保存到数据库
        this.logger.log(`✅ 同步完成，共 ${filtered.length} 款游戏`);
      });

      return { message: '同步任务已启动' };
    } catch (error) {
      this.logger.error('手动同步失败:', error);
      return { error: error.message };
    }
  }

  /**
   * 获取聚合统计信息
   * GET /api/games/stats/summary
   */
  @Get('stats/summary')
  async getStats() {
    try {
      this.logger.log('获取聚合统计信息...');
      
      // TODO: 从数据库获取统计信息
      
      return {
        totalGames: 0,
        gamesBySource: {
          rawg: 0,
          itch: 0,
          igdb: 0,
          wechat: 0,
          douyin: 0,
        },
        lastSyncTime: new Date(),
      };
    } catch (error) {
      this.logger.error('获取统计信息失败:', error);
      return { error: error.message };
    }
  }
}
