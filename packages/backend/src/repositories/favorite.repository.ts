/**
 * Favorite Repository
 * 收藏仓库
 * 
 * 封装所有收藏相关的数据库操作
 */

import { Repository } from 'typeorm'
import { Favorite } from '../modules/favorites/entities/favorite.entity'
import { BaseRepository, PaginationParams, PaginationResult } from './base.repository'
import { AppDataSource } from '../config/database.config'

/**
 * 收藏查询过滤条件
 */
export interface FavoriteFilter {
  userId?: string
  gameId?: string
  period?: 'today' | 'week' | 'month' | 'year'
}

/**
 * 收藏统计信息
 */
export interface FavoriteStats {
  totalFavorites: number
  popularGames: Array<{
    gameId: string
    count: number
    game?: any
  }>
  activeUsers: Array<{
    userId: string
    count: number
    user?: any
  }>
}

/**
 * 收藏仓库类
 */
export class FavoriteRepository extends BaseRepository<Favorite> {
  constructor(repository?: Repository<Favorite>) {
    super(repository || AppDataSource.getRepository(Favorite))
  }

  /**
   * 获取收藏列表（带过滤和分页）
   */
  async findFavoritesWithFilters(
    filters: FavoriteFilter,
    pagination: PaginationParams
  ): Promise<PaginationResult<Favorite>> {
    const queryBuilder = this.repository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.user', 'user')
      .leftJoinAndSelect('favorite.game', 'game')

    // 用户ID过滤
    if (filters.userId) {
      queryBuilder.andWhere('favorite.user_id = :userId', { userId: filters.userId })
    }

    // 游戏ID过滤
    if (filters.gameId) {
      queryBuilder.andWhere('favorite.game_id = :gameId', { gameId: filters.gameId })
    }

    // 时间范围过滤
    if (filters.period) {
      const startDate = this.getStartDateForPeriod(filters.period)
      queryBuilder.andWhere('favorite.created_at >= :startDate', { startDate })
    }

    // 分页
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const skip = (page - 1) * limit

    queryBuilder.orderBy('favorite.created_at', 'DESC').skip(skip).take(limit)

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
   * 查找用户对某个游戏的收藏
   */
  async findByUserAndGame(userId: string, gameId: string): Promise<Favorite | null> {
    return await this.repository.findOne({
      where: { userId, gameId }
    })
  }

  /**
   * 检查是否已收藏
   */
  async isFavorited(userId: string, gameId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { userId, gameId }
    })
    return count > 0
  }

  /**
   * 获取用户收藏的游戏列表
   */
  async findUserFavoriteGames(
    userId: string,
    filters: Partial<FavoriteFilter>,
    pagination: PaginationParams
  ): Promise<PaginationResult<Favorite>> {
    const queryBuilder = this.repository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.game', 'game')
      .where('favorite.user_id = :userId', { userId })
      .andWhere('game.availability_status = :status', { status: 'active' })

    // 类型过滤
    if (filters.gameId) {
      queryBuilder.andWhere('game.genre = :genre', { genre: filters.gameId })
    }

    // 分页
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const skip = (page - 1) * limit

    queryBuilder.orderBy('favorite.created_at', 'DESC').skip(skip).take(limit)

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
   * 获取游戏的收藏用户列表
   */
  async findGameFavoriteUsers(
    gameId: string,
    pagination: PaginationParams
  ): Promise<PaginationResult<Favorite>> {
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const skip = (page - 1) * limit

    const [data, total] = await this.repository.findAndCount({
      where: { gameId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit
    })

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
   * 获取收藏统计信息
   */
  async getFavoriteStats(filters: FavoriteFilter): Promise<FavoriteStats> {
    const queryBuilder = this.repository.createQueryBuilder('favorite')

    // 用户ID过滤
    if (filters.userId) {
      queryBuilder.andWhere('favorite.user_id = :userId', { userId: filters.userId })
    }

    // 游戏ID过滤
    if (filters.gameId) {
      queryBuilder.andWhere('favorite.game_id = :gameId', { gameId: filters.gameId })
    }

    // 时间范围过滤
    if (filters.period) {
      const startDate = this.getStartDateForPeriod(filters.period)
      queryBuilder.andWhere('favorite.created_at >= :startDate', { startDate })
    }

    // 总收藏数
    const totalFavorites = await queryBuilder.getCount()

    // 最受欢迎的游戏（按收藏数排序）
    const popularGames = await this.repository
      .createQueryBuilder('favorite')
      .select('favorite.game_id', 'gameId')
      .addSelect('COUNT(favorite.game_id)', 'count')
      .leftJoin('favorite.game', 'game')
      .groupBy('favorite.game_id')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()

    // 最活跃的用户（按收藏数排序）
    const activeUsers = await this.repository
      .createQueryBuilder('favorite')
      .select('favorite.user_id', 'userId')
      .addSelect('COUNT(favorite.user_id)', 'count')
      .leftJoin('favorite.user', 'user')
      .groupBy('favorite.user_id')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()

    return {
      totalFavorites,
      popularGames: popularGames.map((item: any) => ({
        gameId: item.gameId,
        count: parseInt(item.count)
      })),
      activeUsers: activeUsers.map((item: any) => ({
        userId: item.userId,
        count: parseInt(item.count)
      }))
    }
  }

  /**
   * 获取用户的收藏数量
   */
  async countUserFavorites(userId: string): Promise<number> {
    return await this.repository.count({
      where: { userId }
    })
  }

  /**
   * 获取游戏的收藏数量
   */
  async countGameFavorites(gameId: string): Promise<number> {
    return await this.repository.count({
      where: { gameId }
    })
  }

  /**
   * 删除用户对某个游戏的收藏
   */
  async removeByUserAndGame(userId: string, gameId: string): Promise<boolean> {
    const favorite = await this.findByUserAndGame(userId, gameId)
    if (favorite) {
      await this.remove(favorite)
      return true
    }
    return false
  }

  /**
   * 根据时间段获取开始日期
   */
  private getStartDateForPeriod(period: 'today' | 'week' | 'month' | 'year'): Date {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    return startDate
  }
}

// 导出单例实例
let favoriteRepositoryInstance: FavoriteRepository | null = null

export const getFavoriteRepositoryInstance = (): FavoriteRepository => {
  if (!favoriteRepositoryInstance) {
    favoriteRepositoryInstance = new FavoriteRepository()
  }
  return favoriteRepositoryInstance
}

