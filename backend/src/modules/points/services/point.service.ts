/**
 * Point Service
 * Manages point balance and transactions
 * T072: Implement PointService with balance and transaction methods
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PointTransaction, TransactionType, TransactionStatus } from '../entities/point-transaction.entity';
import { User } from '../../users/entities/user.entity';
import { PointCalculationService } from './point-calculation.service';

export interface PointBalanceResponse {
  balance: number;
  pending: number;
}

export interface CreateTransactionData {
  userId: string;
  type: TransactionType;
  amount: number;
  source: string;
  sourceId?: string;
  description: string;
}

@Injectable()
export class PointService {
  private readonly logger = new Logger(PointService.name);

  constructor(
    @InjectRepository(PointTransaction)
    private readonly transactionRepository: Repository<PointTransaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly calculationService: PointCalculationService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get user point balance
   */
  async getBalance(userId: string): Promise<PointBalanceResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get pending transactions
    const pendingTransactions = await this.transactionRepository.find({
      where: {
        userId,
        status: TransactionStatus.PENDING,
      },
    });

    const pending = pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      balance: user.point_balance || 0,
      pending,
    };
  }

  /**
   * Award points to user
   */
  async awardPoints(
    userId: string,
    amount: number,
    source: string,
    sourceId?: string,
    description?: string,
  ): Promise<PointTransaction> {
    this.calculationService.validatePointAmount(amount);

    return this.dataSource.transaction(async (manager) => {
      // Get user with lock
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Calculate new balance
      const newBalance = this.calculationService.calculateNewBalance(
        user.point_balance || 0,
        amount,
      );

      // Create transaction
      const transaction = manager.create(PointTransaction, {
        userId,
        transactionType: TransactionType.EARN,
        amount,
        source,
        sourceId,
        description: description || `Earned ${amount} points from ${source}`,
        status: TransactionStatus.COMPLETED,
        balanceAfter: newBalance,
      });

      transaction.validate();
      await manager.save(transaction);

      // Update user balance
      user.point_balance = newBalance;
      await manager.save(user);

      this.logger.log(`Awarded ${amount} points to user ${userId}. New balance: ${newBalance}`);

      return transaction;
    });
  }

  /**
   * Deduct points from user
   */
  async deductPoints(
    userId: string,
    amount: number,
    source: string,
    sourceId?: string,
    description?: string,
  ): Promise<PointTransaction> {
    this.calculationService.validatePointAmount(amount);

    return this.dataSource.transaction(async (manager) => {
      // Get user with lock
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check sufficient balance
      if ((user.point_balance || 0) < amount) {
        throw new BadRequestException('Insufficient points balance');
      }

      // Calculate new balance
      const newBalance = this.calculationService.calculateNewBalance(
        user.point_balance || 0,
        -amount,
      );

      // Create transaction
      const transaction = manager.create(PointTransaction, {
        userId,
        transactionType: TransactionType.SPEND,
        amount: -amount,
        source,
        sourceId,
        description: description || `Spent ${amount} points on ${source}`,
        status: TransactionStatus.COMPLETED,
        balanceAfter: newBalance,
      });

      transaction.validate();
      await manager.save(transaction);

      // Update user balance
      user.point_balance = newBalance;
      await manager.save(user);

      this.logger.log(`Deducted ${amount} points from user ${userId}. New balance: ${newBalance}`);

      return transaction;
    });
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    userId: string,
    options: {
      type?: TransactionType;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ transactions: PointTransaction[]; total: number }> {
    const { type, page = 1, limit = 20 } = options;

    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.user_id = :userId', { userId })
      .orderBy('transaction.created_at', 'DESC');

    if (type) {
      query.andWhere('transaction.transaction_type = :type', { type });
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [transactions, total] = await query.getManyAndCount();

    return { transactions, total };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<PointTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Check if source has existing transaction (prevent duplicates)
   */
  async hasExistingTransaction(userId: string, source: string, sourceId: string): Promise<boolean> {
    const count = await this.transactionRepository.count({
      where: {
        userId,
        source,
        sourceId,
        status: TransactionStatus.COMPLETED,
      },
    });

    return count > 0;
  }

  /**
   * Get user's total earned points
   */
  async getTotalEarned(userId: string): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.user_id = :userId', { userId })
      .andWhere('transaction.transaction_type = :type', { type: TransactionType.EARN })
      .andWhere('transaction.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();

    return parseInt(result?.total || 0);
  }

  /**
   * Get user's total spent points
   */
  async getTotalSpent(userId: string): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(ABS(transaction.amount))', 'total')
      .where('transaction.user_id = :userId', { userId })
      .andWhere('transaction.transaction_type = :type', { type: TransactionType.SPEND })
      .andWhere('transaction.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();

    return parseInt(result?.total || 0);
  }
}
