/**
 * Repository Service
 * 仓库服务
 * 
 * 提供统一的数据库访问接口，支持 TypeORM 实体操作
 * Provides unified database access interface with TypeORM entity operations
 */

import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Game } from '../modules/games/entities/game.entity';

@Injectable()
export class RepositoryService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource
  ) {}

  /**
   * 获取用户仓库
   * Get User Repository
   */
  getUserRepository(): Repository<User> {
    return this.dataSource.getRepository(User);
  }

  /**
   * 获取游戏仓库
   * Get Game Repository
   */
  getGameRepository(): Repository<Game> {
    return this.dataSource.getRepository(Game);
  }
}

/**
 * 便捷函数：获取用户仓库
 * Convenience function: Get User Repository
 */
let repositoryService: RepositoryService;

export const setRepositoryService = (service: RepositoryService) => {
  repositoryService = service;
};

export const getUserRepository = (): Repository<User> => {
  if (!repositoryService) {
    throw new Error('RepositoryService not initialized. Make sure to call setRepositoryService first.');
  }
  return repositoryService.getUserRepository();
};

export const getGameRepository = (): Repository<Game> => {
  if (!repositoryService) {
    throw new Error('RepositoryService not initialized. Make sure to call setRepositoryService first.');
  }
  return repositoryService.getGameRepository();
};
