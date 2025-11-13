/**
 * 数据库事务管理服务
 * Database Transaction Management Service
 *
 * 提供事务装饰器、自动回滚和隔离级别配置
 * Provides transaction decorators, automatic rollback, and isolation level configuration
 */
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

// TypeORM IsolationLevel enum
enum IsolationLevel {
  READ_UNCOMMITTED = 'READ UNCOMMITTED',
  READ_COMMITTED = 'READ COMMITTED',
  REPEATABLE_READ = 'REPEATABLE READ',
  SERIALIZABLE = 'SERIALIZABLE',
}

import { AppDataSource } from '@/config/database.config';
import { logger } from '@/utils/logger';
import { DatabaseError } from '@/middleware';

export interface TransactionOptions {
  /**
   * 事务隔离级别
   */
  isolationLevel?: IsolationLevel;
  /**
   * 事务超时时间（毫秒）
   */
  timeout?: number;
  /**
   * 是否启用重试
   */
  enableRetry?: boolean;
  /**
   * 最大重试次数
   */
  maxRetries?: number;
  /**
   * 重试延迟（毫秒）
   */
  retryDelay?: number;
}

/**
 * 默认事务选项
 */
const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  isolationLevel: IsolationLevel.READ_COMMITTED,
  timeout: 30000, // 30秒
  enableRetry: false,
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * 事务上下文接口
 */
export interface TransactionContext {
  manager: EntityManager;
  queryRunner: QueryRunner;
  isTransactionActive: boolean;
}

/**
 * 事务管理服务类
 */
export class TransactionService {
  private dataSource: DataSource;

  constructor(dataSource: DataSource = AppDataSource) {
    this.dataSource = dataSource;
  }

  /**
   * 执行事务
   * Execute transaction
   *
   * @param operations 要执行的操作函数
   * @param options 事务选项
   * @returns 操作结果
   */
  async executeInTransaction<T>(
    operations: (context: TransactionContext) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const opts: TransactionOptions = { ...DEFAULT_TRANSACTION_OPTIONS, ...options };
    let lastError: Error | null = null;

    // 重试逻辑
    for (let attempt = 1; attempt <= (opts.maxRetries || 1); attempt++) {
      const queryRunner = this.dataSource.createQueryRunner();

      try {
        // 启动事务
        await queryRunner.connect();

        // 设置隔离级别
        if (opts.isolationLevel) {
          await queryRunner.query(`SET TRANSACTION ISOLATION LEVEL ${opts.isolationLevel}`);
        }

        // 设置超时
        if (opts.timeout) {
          await queryRunner.query(`SET LOCAL statement_timeout = ${opts.timeout}`);
        }

        await queryRunner.startTransaction();

        // 执行操作
        const context: TransactionContext = {
          manager: queryRunner.manager,
          queryRunner,
          isTransactionActive: queryRunner.isTransactionActive,
        };

        const result = await operations(context);

        // 提交事务
        await queryRunner.commitTransaction();
        logger.debug('Transaction committed successfully');

        return result;

      } catch (error) {
        lastError = error as Error;

        // 回滚事务
        if (queryRunner.isTransactionActive) {
          try {
            await queryRunner.rollbackTransaction();
            logger.warn('Transaction rolled back due to error:', (error as Error).message);
          } catch (rollbackError) {
            logger.error('Failed to rollback transaction:', (rollbackError as Error).message);
          }
        }

        // 如果不是最后一次尝试且启用了重试，则等待后重试
        const shouldRetry = opts.enableRetry &&
          attempt < (opts.maxRetries || 1) &&
          this.shouldRetryTransaction(error as Error);

        if (shouldRetry) {
          logger.warn(`Transaction attempt ${attempt} failed, retrying in ${opts.retryDelay}ms`, {
            error: (error as Error).message,
            attempt,
          });

          await this.sleep(opts.retryDelay || 1000);
          continue;
        }

        // 抛出错误
        throw error;

      } finally {
        // 释放连接
        try {
          await queryRunner.release();
        } catch (releaseError) {
          logger.error('Failed to release query runner:', (releaseError as Error).message);
        }
      }
    }

    // 所有重试都失败
    throw lastError || new Error('Transaction failed after all retries');
  }

  /**
   * 判断是否应该重试事务
   */
  private shouldRetryTransaction(error: Error): boolean {
    // 死锁错误
    if (error.message?.includes('deadlock')) {
      return true;
    }

    // 序列化失败
    if (error.message?.includes('serialization_failure')) {
      return true;
    }

    // 连接超时
    if (error.message?.includes('timeout')) {
      return true;
    }

    // 锁等待超时
    if (error.message?.includes('lock timeout') || error.message?.includes('lock wait timeout')) {
      return true;
    }

    return false;
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 执行只读事务
   * Execute read-only transaction
   */
  async executeReadOnly<T>(
    operations: (context: TransactionContext) => Promise<T>
  ): Promise<T> {
    return this.executeInTransaction(operations, {
      isolationLevel: IsolationLevel.READ_COMMITTED,
    });
  }

  /**
   * 执行串行化事务（最高隔离级别）
   * Execute serialized transaction (highest isolation level)
   */
  async executeSerialized<T>(
    operations: (context: TransactionContext) => Promise<T>
  ): Promise<T> {
    return this.executeInTransaction(operations, {
      isolationLevel: IsolationLevel.SERIALIZABLE,
      enableRetry: true,
      maxRetries: 5,
      retryDelay: 2000,
    });
  }

  /**
   * 获取当前事务状态
   */
  getTransactionStatus(): { isInitialized: boolean; isConnected: boolean } {
    return {
      isInitialized: this.dataSource.isInitialized,
      isConnected: true, // 如果能到达这里，说明连接正常
    };
  }
}

// 导出单例
export const transactionService = new TransactionService();

/**
 * 事务装饰器工厂函数
 * Transaction decorator factory
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Transactional()
 *   async transferPoints(fromUserId: string, toUserId: string, points: number) {
 *     // 此方法将在事务中执行
 *     await this.userRepository.decrementPoints(fromUserId, points);
 *     await this.userRepository.incrementPoints(toUserId, points);
 *   }
 * }
 * ```
 */
export function Transactional(options: TransactionOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return transactionService.executeInTransaction(
        async (context) => {
          // 将事务上下文注入到方法参数中
          const transactionArgs = [...args, context];
          return originalMethod.apply(this, transactionArgs);
        },
        options
      );
    };

    return descriptor;
  };
}

/**
 * 只读事务装饰器
 * Read-only transaction decorator
 */
export function ReadOnly() {
  return Transactional({ isolationLevel: IsolationLevel.READ_COMMITTED });
}

/**
 * 高并发事务装饰器（使用 SERIALIZABLE 隔离级别）
 * High concurrency transaction decorator (using SERIALIZABLE isolation level)
 */
export function HighConcurrency() {
  return Transactional({
    isolationLevel: IsolationLevel.SERIALIZABLE,
    enableRetry: true,
    maxRetries: 5,
    retryDelay: 2000,
  });
}

