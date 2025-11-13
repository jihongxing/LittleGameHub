/**
 * Repository Service
 * 为传统控制器提供TypeORM实体访问的桥接服务
 * 
 * This service provides a bridge for legacy controllers to access TypeORM entities
 * without requiring full NestJS dependency injection refactoring.
 * 
 * 此服务为传统控制器提供访问TypeORM实体的桥接，
 * 无需完全重构为NestJS依赖注入模式。
 */

import { AppDataSource } from '../config/database.config'
import { User } from '../modules/users/entities/user.entity'
import { Game } from '../modules/games/entities/game.entity'
import { Favorite } from '../modules/favorites/entities/favorite.entity'
import { Download } from '../modules/downloads/entities/download.entity'
import { Repository } from 'typeorm'

/**
 * Repository Service Class
 * 仓库服务类
 */
export class RepositoryService {
  private static instance: RepositoryService
  private userRepository: Repository<User>
  private gameRepository: Repository<Game>
  private favoriteRepository: Repository<Favorite>
  private downloadRepository: Repository<Download>

  private constructor() {
    // 初始化仓库
    this.userRepository = AppDataSource.getRepository(User)
    this.gameRepository = AppDataSource.getRepository(Game)
    this.favoriteRepository = AppDataSource.getRepository(Favorite)
    this.downloadRepository = AppDataSource.getRepository(Download)
  }

  /**
   * Get singleton instance
   * 获取单例实例
   */
  public static getInstance(): RepositoryService {
    if (!RepositoryService.instance) {
      RepositoryService.instance = new RepositoryService()
    }
    return RepositoryService.instance
  }

  /**
   * Get User Repository
   * 获取用户仓库
   */
  public getUserRepository(): Repository<User> {
    return this.userRepository
  }

  /**
   * Get Game Repository
   * 获取游戏仓库
   */
  public getGameRepository(): Repository<Game> {
    return this.gameRepository
  }

  /**
   * Get Favorite Repository
   * 获取收藏仓库
   */
  public getFavoriteRepository(): Repository<Favorite> {
    return this.favoriteRepository
  }

  /**
   * Get Download Repository
   * 获取下载仓库
   */
  public getDownloadRepository(): Repository<Download> {
    return this.downloadRepository
  }

  /**
   * Initialize repositories (call after database connection)
   * 初始化仓库（在数据库连接后调用）
   */
  public async initialize(): Promise<void> {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }
    
    this.userRepository = AppDataSource.getRepository(User)
    this.gameRepository = AppDataSource.getRepository(Game)
    this.favoriteRepository = AppDataSource.getRepository(Favorite)
    this.downloadRepository = AppDataSource.getRepository(Download)
  }
}

// 导出单例实例
export const repositoryService = RepositoryService.getInstance()

// 导出便捷的仓库访问器
export const getUserRepository = () => repositoryService.getUserRepository()
export const getGameRepository = () => repositoryService.getGameRepository()
export const getFavoriteRepository = () => repositoryService.getFavoriteRepository()
export const getDownloadRepository = () => repositoryService.getDownloadRepository()
