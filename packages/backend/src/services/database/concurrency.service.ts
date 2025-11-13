/**
 * 并发控制服务
 * Concurrency Control Service
 *
 * 提供乐观锁、悲观锁和分布式锁机制
 * Provides optimistic locking, pessimistic locking, and distributed locking mechanisms
 */
import { EntityManager } from 'typeorm';
import { getRedisClient } from '@/config/redis.config';
import { logger } from '@/utils/logger';
import { DatabaseError, ConflictError } from '@/middleware';
import { TransactionContext } from './transaction.service';

export interface OptimisticLockOptions {
  /**
   * 版本字段名
   */
  versionField?: string;
  /**
   * 最大重试次数
   */
  maxRetries?: number;
  /**
   * 重试延迟（毫秒）
   */
  retryDelay?: number;
}

export interface PessimisticLockOptions {
  /**
   * 锁模式
   */
  lockMode?: 'FOR UPDATE' | 'FOR SHARE';
  /**
   * 锁超时时间（毫秒）
   */
  timeout?: number;
}

export interface DistributedLockOptions {
  /**
   * 锁的TTL（秒）
   */
  ttl?: number;
  /**
   * 最大重试次数
   */
  maxRetries?: number;
  /**
   * 重试间隔（毫秒）
   */
  retryInterval?: number;
}

/**
 * 分布式锁类
 */
export class DistributedLock {
  private readonly PREFIX = 'lock:';

  /**
   * 获取分布式锁
   */
  async acquire(
    key: string,
    options: DistributedLockOptions = {}
  ): Promise<string | null> {
    const opts = {
      ttl: 30, // 30秒
      maxRetries: 3,
      retryInterval: 100,
      ...options,
    };

    const lockKey = this.PREFIX + key;
    const lockValue = `${process.pid}:${Date.now()}:${Math.random()}`;

    try {
      const redisClient = getRedisClient();

      for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
          // 尝试获取锁
          const result = await redisClient.set(lockKey, lockValue, {
            NX: true, // 只在键不存在时设置
            EX: opts.ttl, // 设置过期时间
          });

          if (result === 'OK') {
            logger.debug(`Distributed lock acquired: ${key}`);
            return lockValue;
          }

          // 如果是最后一次尝试，返回null
          if (attempt === opts.maxRetries) {
            logger.warn(`Failed to acquire distributed lock: ${key}`);
            return null;
          }

          // 等待后重试
          await this.sleep(opts.retryInterval);

        } catch (redisError) {
          logger.error('Redis error during lock acquisition:', redisError as Error);

          // 如果是最后一次尝试，返回null
          if (attempt === opts.maxRetries) {
            return null;
          }

          await this.sleep(opts.retryInterval);
        }
      }

      return null;
    } catch (error) {
      logger.error('Failed to acquire distributed lock:', error as Error);
      return null;
    }
  }

  /**
   * 释放分布式锁
   */
  async release(key: string, lockValue: string): Promise<boolean> {
    if (!lockValue) {
      return false;
    }

    const lockKey = this.PREFIX + key;

    try {
      const redisClient = getRedisClient();

      // 使用 Lua 脚本确保原子性：只有当值匹配时才删除
      const script = `
        if redis.call('GET', KEYS[1]) == ARGV[1] then
          return redis.call('DEL', KEYS[1])
        else
          return 0
        end
      `;

      const result = await redisClient.eval(script, {
        keys: [lockKey],
        arguments: [lockValue],
      });

      const success = result === 1;
      if (success) {
        logger.debug(`Distributed lock released: ${key}`);
      } else {
        logger.warn(`Failed to release distributed lock (value mismatch): ${key}`);
      }

      return success;
    } catch (error) {
      logger.error('Failed to release distributed lock:', error as Error);
      return false;
    }
  }

  /**
   * 扩展锁的TTL
   */
  async extend(key: string, lockValue: string, ttl: number = 30): Promise<boolean> {
    const lockKey = this.PREFIX + key;

    try {
      const redisClient = getRedisClient();

      // 使用 Lua 脚本确保原子性
      const script = `
        if redis.call('GET', KEYS[1]) == ARGV[1] then
          return redis.call('EXPIRE', KEYS[1], ARGV[2])
        else
          return 0
        end
      `;

      const result = await redisClient.eval(script, {
        keys: [lockKey],
        arguments: [lockValue, ttl.toString()],
      });

      return result === 1;
    } catch (error) {
      logger.error('Failed to extend distributed lock:', error as Error);
      return false;
    }
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 并发控制服务类
 */
export class ConcurrencyService {
  private distributedLock: DistributedLock;

  constructor() {
    this.distributedLock = new DistributedLock();
  }

  /**
   * 乐观锁更新
   * Optimistic lock update
   *
   * @param entity 要更新的实体
   * @param updateFn 更新函数
   * @param options 乐观锁选项
   * @returns 更新后的实体
   *
   * @example
   * ```typescript
   * const updatedUser = await concurrencyService.optimisticUpdate(
   *   user,
   *   async (user) => {
   *     user.pointBalance += points;
   *     return user;
   *   }
   * );
   * ```
   */
  async optimisticUpdate<T extends { version?: number }>(
    entity: T,
    updateFn: (entity: T) => Promise<T> | T,
    options: OptimisticLockOptions = {}
  ): Promise<T> {
    const opts = {
      versionField: 'version',
      maxRetries: 3,
      retryDelay: 100,
      ...options,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        // 执行更新函数
        const updatedEntity = await updateFn({ ...entity });

        // 如果有版本字段，进行乐观锁检查
        if (opts.versionField && updatedEntity[opts.versionField] !== undefined) {
          const currentVersion = entity[opts.versionField] || 0;
          const newVersion = currentVersion + 1;

          // 模拟数据库中的版本检查
          // 在实际应用中，这应该在数据库查询中完成
          if (updatedEntity[opts.versionField] !== currentVersion) {
            throw new ConflictError('数据已被其他事务修改，请重试');
          }

          updatedEntity[opts.versionField] = newVersion;
        }

        return updatedEntity;

      } catch (error) {
        lastError = error as Error;

        // 如果是冲突错误且不是最后一次尝试，继续重试
        if (error instanceof ConflictError && attempt < opts.maxRetries) {
          logger.warn(`Optimistic lock conflict, retrying (${attempt}/${opts.maxRetries})`);
          await this.sleep(opts.retryDelay);
          continue;
        }

        throw error;
      }
    }

    throw lastError || new Error('Optimistic lock update failed after all retries');
  }

  /**
   * 悲观锁查询
   * Pessimistic lock query
   *
   * @param manager EntityManager
   * @param entityClass 实体类
   * @param conditions 查询条件
   * @param options 锁选项
   * @returns 锁定后的实体
   *
   * @example
   * ```typescript
   * const lockedUser = await concurrencyService.pessimisticLock(
   *   manager,
   *   User,
   *   { id: userId }
   * );
   * ```
   */
  async pessimisticLock<T extends { id: any }>(
    manager: EntityManager,
    entityClass: new () => T,
    conditions: any,
    options: PessimisticLockOptions = {}
  ): Promise<T> {
    const opts = {
      lockMode: 'FOR UPDATE',
      timeout: 10000,
      ...options,
    };

    try {
      const queryBuilder = manager
        .createQueryBuilder(entityClass, 'entity')
        .setLock(opts.lockMode as any)
        .where(conditions);

      // 设置锁超时（如果支持）
      if (opts.timeout) {
        queryBuilder.setParameters({ lockTimeout: opts.timeout });
      }

      const entity = await queryBuilder.getOne();

      if (!entity) {
        throw new Error('Entity not found for pessimistic lock');
      }

      return entity;
    } catch (error) {
      logger.error('Pessimistic lock failed:', error as Error);
      throw new DatabaseError('获取资源锁失败，请稍后重试', { originalError: (error as Error).message });
    }
  }

  /**
   * 分布式锁执行函数
   * Execute function with distributed lock
   *
   * @param key 锁键
   * @param fn 要执行的函数
   * @param options 锁选项
   * @returns 函数执行结果
   *
   * @example
   * ```typescript
   * const result = await concurrencyService.withDistributedLock(
   *   `user:${userId}:points`,
   *   async () => {
   *     return await userService.updatePoints(userId, points);
   *   }
   * );
   * ```
   */
  async withDistributedLock<T>(
    key: string,
    fn: () => Promise<T>,
    options: DistributedLockOptions = {}
  ): Promise<T> {
    const lockValue = await this.distributedLock.acquire(key, options);

    if (!lockValue) {
      throw new ConflictError(`无法获取分布式锁: ${key}`);
    }

    try {
      logger.debug(`Executing function with distributed lock: ${key}`);
      return await fn();
    } finally {
      await this.distributedLock.release(key, lockValue);
    }
  }

  /**
   * 原子计数器更新
   * Atomic counter update
   *
   * @param key 计数器键
   * @param increment 增量
   * @returns 新的计数值
   */
  async atomicCounter(key: string, increment: number = 1): Promise<number> {
    try {
      const redisClient = getRedisClient();

      const newValue = await redisClient.incrBy(key, increment);

      logger.debug(`Atomic counter updated: ${key} = ${newValue}`);
      return newValue;
    } catch (error) {
      logger.error('Atomic counter update failed:', error as Error);
      throw new DatabaseError('原子计数器更新失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 获取计数器值
   */
  async getCounter(key: string): Promise<number> {
    try {
      const redisClient = getRedisClient();

      const value = await redisClient.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      logger.error('Failed to get counter value:', error as Error);
      return 0;
    }
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例
export const concurrencyService = new ConcurrencyService();
export const distributedLock = new DistributedLock();
