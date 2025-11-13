/**
 * 积分服务
 * Points Service
 *
 * 处理用户积分的并发安全更新
 * Handle concurrent-safe user points updates
 */
import { getUserRepository } from '@/services/repository.service';
import { User } from '@/modules/users/entities/user.entity';
import { logger } from '@/utils/logger';
import { DatabaseError, ConflictError } from '@/middleware';
import {
  transactionService,
  concurrencyService,
  Transactional,
  HighConcurrency,
  type TransactionContext
} from '@/services/database';

export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend' | 'transfer_in' | 'transfer_out';
  description: string;
  referenceId?: string;
  createdAt: Date;
}

export class PointsService {
  private userRepository = getUserRepository();

  /**
   * 获取用户积分余额（并发安全）
   * Get user points balance (thread-safe)
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'point_balance'],
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      return user.point_balance;
    } catch (error) {
      logger.error('Failed to get user balance:', error as Error);
      throw new DatabaseError('获取积分余额失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 增加用户积分（高并发安全）
   * Add points to user (high concurrency safe)
   */
  @HighConcurrency()
  async addPoints(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    context?: TransactionContext
  ): Promise<number> {
    if (amount <= 0) {
      throw new Error('积分数量必须大于0');
    }

    const manager = context?.manager || this.userRepository.manager;

    try {
      // 使用分布式锁确保并发安全
      return await concurrencyService.withDistributedLock(
        `user:${userId}:points`,
        async () => {
          // 查询当前用户
          const user = await manager.findOne(User, {
            where: { id: userId },
            lock: { mode: 'pessimistic_write' }, // 悲观锁
          });

          if (!user) {
            throw new Error('用户不存在');
          }

          // 计算新余额
          const newBalance = user.point_balance + amount;

          // 更新用户积分
          await manager.update(User, { id: userId }, { point_balance: newBalance });

          // 记录积分交易（这里可以扩展为真正的交易记录表）
          logger.info('Points added', {
            userId,
            amount,
            newBalance,
            description,
            referenceId,
          });

          return newBalance;
        },
        { ttl: 10 } // 10秒锁超时
      );
    } catch (error) {
      logger.error('Failed to add points:', error as Error);
      throw new DatabaseError('增加积分失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 扣除用户积分（高并发安全）
   * Deduct points from user (high concurrency safe)
   */
  @HighConcurrency()
  async deductPoints(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    context?: TransactionContext
  ): Promise<number> {
    if (amount <= 0) {
      throw new Error('积分数量必须大于0');
    }

    const manager = context?.manager || this.userRepository.manager;

    try {
      return await concurrencyService.withDistributedLock(
        `user:${userId}:points`,
        async () => {
          // 查询当前用户（使用悲观锁）
          const user = await manager.findOne(User, {
            where: { id: userId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!user) {
            throw new Error('用户不存在');
          }

          // 检查余额是否足够
          if (user.point_balance < amount) {
            throw new ConflictError('积分余额不足');
          }

          // 计算新余额
          const newBalance = user.point_balance - amount;

          // 更新用户积分
          await manager.update(User, { id: userId }, { point_balance: newBalance });

          // 记录积分交易
          logger.info('Points deducted', {
            userId,
            amount,
            newBalance,
            description,
            referenceId,
          });

          return newBalance;
        },
        { ttl: 10 }
      );
    } catch (error) {
      logger.error('Failed to deduct points:', error as Error);
      if (error instanceof ConflictError) {
        throw error;
      }
      throw new DatabaseError('扣除积分失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 积分转账（事务安全）
   * Transfer points between users (transaction safe)
   */
  @Transactional()
  async transferPoints(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string = '积分转账',
    context: TransactionContext
  ): Promise<{ fromBalance: number; toBalance: number }> {
    if (amount <= 0) {
      throw new Error('转账金额必须大于0');
    }

    if (fromUserId === toUserId) {
      throw new Error('不能给自己转账');
    }

    try {
      // 先扣除发送方积分
      const fromBalance = await this.deductPoints(
        fromUserId,
        amount,
        `${description}(转出)`,
        `transfer:${toUserId}`,
        context
      );

      // 再增加接收方积分
      const toBalance = await this.addPoints(
        toUserId,
        amount,
        `${description}(转入)`,
        `transfer:${fromUserId}`,
        context
      );

      logger.info('Points transferred successfully', {
        fromUserId,
        toUserId,
        amount,
        fromBalance,
        toBalance,
      });

      return { fromBalance, toBalance };
    } catch (error) {
      logger.error('Failed to transfer points:', error as Error);
      throw new DatabaseError('积分转账失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 批量积分操作（事务安全）
   * Batch points operations (transaction safe)
   */
  @Transactional()
  async batchUpdatePoints(
    operations: Array<{
      userId: string;
      amount: number;
      type: 'add' | 'deduct';
      description: string;
      referenceId?: string;
    }>,
    context: TransactionContext
  ): Promise<Array<{ userId: string; newBalance: number; success: boolean }>> {
    const results: Array<{ userId: string; newBalance: number; success: boolean }> = [];

    try {
      for (const operation of operations) {
        try {
          let newBalance: number;

          if (operation.type === 'add') {
            newBalance = await this.addPoints(
              operation.userId,
              operation.amount,
              operation.description,
              operation.referenceId,
              context
            );
          } else {
            newBalance = await this.deductPoints(
              operation.userId,
              operation.amount,
              operation.description,
              operation.referenceId,
              context
            );
          }

          results.push({
            userId: operation.userId,
            newBalance,
            success: true,
          });
        } catch (error) {
          logger.error(`Failed to process batch operation for user ${operation.userId}:`, error as Error);
          results.push({
            userId: operation.userId,
            newBalance: 0,
            success: false,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to execute batch points update:', error as Error);
      throw new DatabaseError('批量积分操作失败', { originalError: (error as Error).message });
    }
  }

  /**
   * 检查积分是否足够
   * Check if user has sufficient points
   */
  async hasEnoughPoints(userId: string, amount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance(userId);
      return balance >= amount;
    } catch (error) {
      logger.error('Failed to check points balance:', error as Error);
      return false;
    }
  }

  /**
   * 获取用户积分历史（模拟）
   * Get user points history (simulated)
   */
  async getPointsHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PointsTransaction[]> {
    // 这里应该从积分交易表中查询
    // 目前返回模拟数据
    return [
      {
        id: '1',
        userId,
        amount: 100,
        type: 'earn',
        description: '游戏奖励',
        createdAt: new Date(),
      },
    ];
  }
}

// 导出单例
export const pointsService = new PointsService();
