/**
 * Game Service 游戏服务
 * Handles game catalog, search, and management 处理游戏目录、搜索和管理
 * T045: Implement GameService with catalog and search methods
 * T045: 实现带有目录和搜索方法的游戏服务
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Game, GameAvailabilityStatus } from '../entities/game.entity';

/**
 * Get games options interface 获取游戏选项接口
 * Defines the parameters for querying games 定义查询游戏的参数
 */
export interface GetGamesOptions {
  category?: string; // 游戏分类 / Game category
  search?: string; // 搜索关键词 / Search keyword
  status?: GameAvailabilityStatus; // 可用状态 / Availability status
  page?: number; // 页码 / Page number
  limit?: number; // 每页限制 / Items per page limit
  sort?: 'popular' | 'latest' | 'rating'; // 排序方式 / Sort method
}

/**
 * Paginated games response interface 分页游戏响应接口
 * Response structure for paginated game queries 分页游戏查询的响应结构
 */
export interface PaginatedGamesResponse {
  games: Game[]; // 游戏列表 / List of games
  pagination: {
    page: number; // 当前页码 / Current page number
    limit: number; // 每页数量 / Items per page
    total: number; // 总记录数 / Total records
    total_pages: number; // 总页数 / Total pages
  };
}

/**
 * Game Service 游戏服务类
 * Provides game-related business logic 提供游戏相关的业务逻辑
 */
@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name); // 日志记录器 / Logger

  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>, // 游戏数据仓库 / Game repository
  ) {}

  /**
   * Get game catalog with filtering, search, and pagination
   * 获取游戏目录，支持筛选、搜索和分页
   * @param options Query options 查询选项
   * @returns Paginated game list 分页游戏列表
   */
  async getGames(options: GetGamesOptions = {}): Promise<PaginatedGamesResponse> {
    const {
      category,
      search,
      status = GameAvailabilityStatus.ACTIVE,
      page = 1,
      limit = 20,
      sort = 'popular',
    } = options;

    const query = this.gameRepository.createQueryBuilder('game'); // 创建查询构建器 / Create query builder

    // Filter by status 按状态筛选
    if (status) {
      query.where('game.availability_status = :status', { status });
    }

    // Filter by category (JSONB array contains) 按分类筛选（JSONB数组包含）
    if (category) {
      query.andWhere('game.category_tags @> :category', {
        category: JSON.stringify([category]),
      });
    }

    // Search by title or description 按标题或描述搜索
    if (search) {
      query.andWhere(
        '(game.title ILIKE :search OR game.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Sort 排序
    switch (sort) {
      case 'popular':
        query.orderBy('game.play_count', 'DESC'); // 按游玩次数降序 / Sort by play count DESC
        break;
      case 'latest':
        query.orderBy('game.created_at', 'DESC'); // 按创建时间降序 / Sort by creation time DESC
        break;
      case 'rating':
        query.orderBy('game.average_rating', 'DESC', 'NULLS LAST'); // 按评分降序，空值最后 / Sort by rating DESC, nulls last
        break;
      default:
        query.orderBy('game.play_count', 'DESC'); // 默认按游玩次数降序 / Default: sort by play count DESC
    }

    // Pagination 分页
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    // Execute query 执行查询
    const [games, total] = await query.getManyAndCount();

    this.logger.log(
      `Retrieved ${games.length} games (page ${page}, total ${total})`
    ); // 记录查询结果日志 / Log query results

    return {
      games, // 游戏数据 / Game data
      pagination: {
        page, // 当前页 / Current page
        limit, // 每页限制 / Items per page
        total, // 总数 / Total count
        total_pages: Math.ceil(total / limit), // 总页数 / Total pages
      },
    };
  }

  /**
   * Get game by ID
   * 根据ID获取游戏
   * @param gameId Game UUID 游戏唯一标识
   * @returns Game entity 游戏实体
   * @throws NotFoundException if game not found 如果游戏未找到则抛出异常
   */
  async getGameById(gameId: string): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
    });

    if (!game) {
      this.logger.warn(`Game not found: ${gameId}`); // 记录游戏未找到警告 / Log game not found warning
      throw new NotFoundException(`Game with ID ${gameId} not found`); // 抛出未找到异常 / Throw not found exception
    }

    return game;
  }

  /**
   * Get multiple games by IDs
   * 根据多个ID获取游戏
   * @param gameIds Array of game UUIDs 游戏唯一标识数组
   * @returns Array of games 游戏数组
   */
  async getGamesByIds(gameIds: string[]): Promise<Game[]> {
    return this.gameRepository.find({
      where: { id: In(gameIds) },
    });
  }

  /**
   * Get featured games
   * 获取精选游戏
   * @param limit Number of games to return 返回游戏数量
   * @returns Array of featured games 精选游戏数组
   */
  async getFeaturedGames(limit: number = 10): Promise<Game[]> {
    return this.gameRepository.find({
      where: {
        isFeatured: true,
        availabilityStatus: GameAvailabilityStatus.ACTIVE,
      },
      order: {
        playCount: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Get games by category
   * 按分类获取游戏
   * @param category Category name 分类名称
   * @param limit Number of games to return 返回游戏数量
   * @returns Array of games 游戏数组
   */
  async getGamesByCategory(category: string, limit: number = 20): Promise<Game[]> {
    const query = this.gameRepository
      .createQueryBuilder('game')
      .where('game.category_tags @> :category', {
        category: JSON.stringify([category]),
      })
      .andWhere('game.availability_status = :status', {
        status: GameAvailabilityStatus.ACTIVE,
      })
      .orderBy('game.play_count', 'DESC')
      .take(limit);

    return query.getMany();
  }

  /**
   * Increment game play count
   * 增加游戏游玩次数
   * @param gameId Game UUID 游戏唯一标识
   */
  async incrementPlayCount(gameId: string): Promise<void> {
    await this.gameRepository.increment({ id: gameId }, 'playCount', 1);
    this.logger.log(`Incremented play count for game: ${gameId}`);
  }

  /**
   * Update game average rating
   * 更新游戏平均评分
   * @param gameId Game UUID 游戏唯一标识
   * @param newRating New rating (1-5) 新评分（1-5分）
   * @param totalRatings Total number of ratings 评分总数
   */
  async updateRating(
    gameId: string,
    newRating: number,
    totalRatings: number,
  ): Promise<void> {
    const game = await this.getGameById(gameId);
    game.updateAverageRating(newRating, totalRatings);
    await this.gameRepository.save(game);
    this.logger.log(`Updated rating for game ${gameId}: ${game.averageRating}`); // 记录评分更新日志 / Log rating update
  }

  /**
   * Create a new game (admin function)
   * 创建新游戏（管理员功能）
   * @param gameData Game data 游戏数据
   * @returns Created game 创建的游戏
   */
  async createGame(gameData: Partial<Game>): Promise<Game> {
    const game = this.gameRepository.create(gameData);
    await this.gameRepository.save(game);
    this.logger.log(`Created new game: ${game.id} - ${game.title}`); // 记录创建游戏日志 / Log game creation
    return game;
  }

  /**
   * Update game (admin function)
   * 更新游戏（管理员功能）
   * @param gameId Game UUID 游戏唯一标识
   * @param gameData Updated game data 更新的游戏数据
   * @returns Updated game 更新后的游戏
   */
  async updateGame(gameId: string, gameData: Partial<Game>): Promise<Game> {
    const game = await this.getGameById(gameId);
    Object.assign(game, gameData);
    await this.gameRepository.save(game);
    this.logger.log(`Updated game: ${gameId}`); // 记录游戏更新日志 / Log game update
    return game;
  }

  /**
   * Delete game (admin function - soft delete)
   * 删除游戏（管理员功能 - 软删除）
   * @param gameId Game UUID 游戏唯一标识
   */
  async deleteGame(gameId: string): Promise<void> {
    const game = await this.getGameById(gameId);
    game.availabilityStatus = GameAvailabilityStatus.INACTIVE;
    await this.gameRepository.save(game);
    this.logger.log(`Soft deleted game: ${gameId}`); // 记录游戏软删除日志 / Log game soft deletion
  }

  /**
   * Search games with advanced filters
   * 使用高级筛选器搜索游戏
   * @param query Search query 搜索查询
   * @param filters Additional filters 附加筛选器
   * @returns Array of matching games 匹配的游戏数组
   */
  async searchGames(
    query: string,
    filters: {
      categories?: string[];
      minRating?: number;
      maxRating?: number;
    } = {},
  ): Promise<Game[]> {
    const queryBuilder = this.gameRepository
      .createQueryBuilder('game')
      .where('game.availability_status = :status', {
        status: GameAvailabilityStatus.ACTIVE,
      });

    // Search in title and description 在标题和描述中搜索
    if (query) {
      queryBuilder.andWhere(
        '(game.title ILIKE :query OR game.description ILIKE :query)',
        { query: `%${query}%` }
      );
    }

    // Filter by categories (OR condition) 按分类筛选（或条件）
    if (filters.categories && filters.categories.length > 0) {
      const categoryConditions = filters.categories.map(
        (cat, index) => `game.category_tags @> :cat${index}`
      );
      queryBuilder.andWhere(`(${categoryConditions.join(' OR ')})`, 
        filters.categories.reduce((acc, cat, index) => {
          acc[`cat${index}`] = JSON.stringify([cat]);
          return acc;
        }, {} as Record<string, string>)
      );
    }

    // Filter by rating range 按评分范围筛选
    if (filters.minRating !== undefined) {
      queryBuilder.andWhere('game.average_rating >= :minRating', {
        minRating: filters.minRating,
      });
    }

    if (filters.maxRating !== undefined) {
      queryBuilder.andWhere('game.average_rating <= :maxRating', {
        maxRating: filters.maxRating,
      });
    }

    queryBuilder.orderBy('game.play_count', 'DESC').take(50); // 按游玩次数降序排序，限制50条 / Order by play count DESC, limit 50

    return queryBuilder.getMany();
  }

  /**
   * Get game statistics
   * 获取游戏统计信息
   * @param gameId Game UUID 游戏唯一标识
   * @returns Game statistics 游戏统计信息
   */
  async getGameStatistics(gameId: string): Promise<{
    play_count: number;
    average_rating: number | null;
    total_sessions: number;
    active_sessions: number;
  }> {
    const game = await this.getGameById(gameId);

    // TODO: Get session statistics from GameSessionService
    // TODO: 从GameSessionService获取会话统计
    const totalSessions = 0; // 总会话数 / Total sessions
    const activeSessions = 0; // 活跃会话数 / Active sessions

    return {
      play_count: game.playCount, // 游玩次数 / Play count
      average_rating: game.averageRating, // 平均评分 / Average rating
      total_sessions: totalSessions, // 总会话数 / Total sessions
      active_sessions: activeSessions, // 活跃会话数 / Active sessions
    };
  }
}
