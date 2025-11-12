/**
 * Game Repository
 * 游戏仓库
 * 
 * 封装所有游戏相关的数据库操作
 */

import { Repository, Like, In } from 'typeorm'
import { Game, GameAvailabilityStatus, Genre, Platform } from '../modules/games/entities/game.entity'
import { BaseRepository, PaginationParams, PaginationResult } from './base.repository'
import { AppDataSource } from '../config/database.config'

/**
 * 游戏查询过滤条件
 */
export interface GameFilter {
  q?: string // 搜索关键词
  genre?: Genre // 游戏类型
  platform?: Platform // 平台
  isFree?: boolean // 是否免费
  isFeatured?: boolean // 是否精选
  availabilityStatus?: GameAvailabilityStatus // 可用状态
}

/**
 * 游戏统计信息
 */
export interface GameStats {
  totalGames: number
  freeGames: number
  paidGames: number
  featuredGames: number
  gamesByGenre: Array<{ genre: string; count: number }>
  gamesByPlatform: Array<{ platform: string; count: number }>
}

/**
 * 游戏仓库类
 */
export class GameRepository extends BaseRepository<Game> {
  constructor(repository?: Repository<Game>) {
    super(repository || AppDataSource.getRepository(Game))
  }

  /**
   * 获取游戏列表（带过滤和分页）
   */
  async findGamesWithFilters(
    filters: GameFilter,
    pagination: PaginationParams
  ): Promise<PaginationResult<Game>> {
    const queryBuilder = this.repository.createQueryBuilder('game')

    // 默认只查询活跃的游戏
    queryBuilder.where('game.availability_status = :status', {
      status: filters.availabilityStatus || GameAvailabilityStatus.ACTIVE
    })

    // 搜索关键词
    if (filters.q) {
      queryBuilder.andWhere(
        '(game.title LIKE :search OR game.description LIKE :search)',
        { search: `%${filters.q}%` }
      )
    }

    // 游戏类型过滤
    if (filters.genre) {
      queryBuilder.andWhere('game.genre = :genre', { genre: filters.genre })
    }

    // 平台过滤
    if (filters.platform) {
      queryBuilder.andWhere(':platform = ANY(game.platforms)', { platform: filters.platform })
    }

    // 是否免费过滤
    if (filters.isFree !== undefined) {
      queryBuilder.andWhere('game.is_free = :isFree', { isFree: filters.isFree })
    }

    // 是否精选过滤
    if (filters.isFeatured !== undefined) {
      queryBuilder.andWhere('game.is_featured = :isFeatured', { isFeatured: filters.isFeatured })
    }

    // 分页
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const skip = (page - 1) * limit

    // 排序
    const sortBy = pagination.sortBy || 'created_at'
    const sortOrder = pagination.sortOrder || 'DESC'
    queryBuilder.orderBy(`game.${sortBy}`, sortOrder).skip(skip).take(limit)

    const [data, total] = await queryBuilder.getManyAndCount()

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 通过ID查找游戏（只查询活跃状态）
   */
  async findActiveById(id: string): Promise<Game | null> {
    return await this.repository.findOne({
      where: {
        id,
        availabilityStatus: GameAvailabilityStatus.ACTIVE
      }
    })
  }

  /**
   * 获取精选游戏
   */
  async findFeaturedGames(pagination: PaginationParams): Promise<PaginationResult<Game>> {
    return await this.findGamesWithFilters(
      {
        isFeatured: true,
        availabilityStatus: GameAvailabilityStatus.ACTIVE
      },
      pagination
    )
  }

  /**
   * 获取免费游戏
   */
  async findFreeGames(pagination: PaginationParams): Promise<PaginationResult<Game>> {
    return await this.findGamesWithFilters(
      {
        isFree: true,
        availabilityStatus: GameAvailabilityStatus.ACTIVE
      },
      pagination
    )
  }

  /**
   * 获取热门游戏（按下载量排序）
   */
  async findPopularGames(pagination: PaginationParams): Promise<PaginationResult<Game>> {
    return await this.findGamesWithFilters(
      { availabilityStatus: GameAvailabilityStatus.ACTIVE },
      { ...pagination, sortBy: 'play_count', sortOrder: 'DESC' }
    )
  }

  /**
   * 获取最新游戏
   */
  async findLatestGames(pagination: PaginationParams): Promise<PaginationResult<Game>> {
    return await this.findGamesWithFilters(
      { availabilityStatus: GameAvailabilityStatus.ACTIVE },
      { ...pagination, sortBy: 'created_at', sortOrder: 'DESC' }
    )
  }

  /**
   * 搜索游戏（高级搜索）
   */
  async searchGames(
    searchQuery: string,
    filters: Partial<GameFilter>,
    pagination: PaginationParams
  ): Promise<PaginationResult<Game>> {
    const queryBuilder = this.repository
      .createQueryBuilder('game')
      .where('game.availability_status = :status', {
        status: GameAvailabilityStatus.ACTIVE
      })
      .andWhere(
        '(game.title LIKE :search OR game.description LIKE :search OR :search = ANY(game.category_tags))',
        { search: `%${searchQuery}%` }
      )

    // 添加其他过滤条件
    if (filters.genre) {
      queryBuilder.andWhere('game.genre = :genre', { genre: filters.genre })
    }

    if (filters.platform) {
      queryBuilder.andWhere(':platform = ANY(game.platforms)', { platform: filters.platform })
    }

    // 分页
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const skip = (page - 1) * limit

    queryBuilder
      .orderBy('game.play_count', 'DESC')
      .addOrderBy('game.created_at', 'DESC')
      .skip(skip)
      .take(limit)

    const [data, total] = await queryBuilder.getManyAndCount()

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 获取游戏统计信息
   */
  async getGameStats(): Promise<GameStats> {
    const queryBuilder = this.repository.createQueryBuilder('game')

    // 总游戏数
    const totalGames = await queryBuilder
      .where('game.availability_status = :status', {
        status: GameAvailabilityStatus.ACTIVE
      })
      .getCount()

    // 免费游戏数
    const freeGames = await queryBuilder
      .where('game.availability_status = :status', {
        status: GameAvailabilityStatus.ACTIVE
      })
      .andWhere('game.is_free = :isFree', { isFree: true })
      .getCount()

    // 付费游戏数
    const paidGames = totalGames - freeGames

    // 精选游戏数
    const featuredGames = await this.repository.count({
      where: {
        availabilityStatus: GameAvailabilityStatus.ACTIVE,
        isFeatured: true
      }
    })

    // 按类型统计
    const gamesByGenre = await queryBuilder
      .select('game.genre', 'genre')
      .addSelect('COUNT(game.id)', 'count')
      .where('game.availability_status = :status', {
        status: GameAvailabilityStatus.ACTIVE
      })
      .groupBy('game.genre')
      .getRawMany()

    // 按平台统计（简化处理，因为platforms是数组）
    const gamesByPlatform: Array<{ platform: string; count: number }> = []

    return {
      totalGames,
      freeGames,
      paidGames,
      featuredGames,
      gamesByGenre,
      gamesByPlatform
    }
  }

  /**
   * 增加播放计数
   */
  async incrementPlayCount(gameId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Game)
      .set({
        playCount: () => 'play_count + 1'
      })
      .where('id = :id', { id: gameId })
      .execute()
  }

  /**
   * 更新游戏状态
   */
  async updateAvailabilityStatus(
    gameId: string,
    status: GameAvailabilityStatus
  ): Promise<void> {
    await this.repository.update({ id: gameId }, { availabilityStatus: status })
  }

  /**
   * 软删除游戏（设置为不活跃）
   */
  async softDeleteGame(gameId: string): Promise<void> {
    await this.updateAvailabilityStatus(gameId, GameAvailabilityStatus.MAINTENANCE)
  }

  /**
   * 更新游戏封面
   */
  async updateCoverImage(gameId: string, coverImageUrl: string): Promise<void> {
    await this.repository.update({ id: gameId }, { coverImageUrl })
  }

  /**
   * 更新游戏截图
   * Note: Screenshots field does not exist in current Game entity
   */
  async updateScreenshots(gameId: string, screenshots: string[]): Promise<void> {
    // TODO: Add screenshots field to Game entity or use a separate table
    // await this.repository.update({ id: gameId }, { screenshotUrls: screenshots })
  }

  /**
   * 添加游戏截图
   * Note: Screenshots field does not exist in current Game entity
   */
  async addScreenshots(gameId: string, newScreenshots: string[]): Promise<void> {
    // TODO: Add screenshots field to Game entity or use a separate table
    // const game = await this.findById(gameId)
    // if (game) {
    //   const existingScreenshots = game.screenshotUrls || []
    //   game.screenshotUrls = [...existingScreenshots, ...newScreenshots]
    //   await this.save(game)
    // }
  }
}

// 导出单例实例
let gameRepositoryInstance: GameRepository | null = null

export const getGameRepositoryInstance = (): GameRepository => {
  if (!gameRepositoryInstance) {
    gameRepositoryInstance = new GameRepository()
  }
  return gameRepositoryInstance
}

