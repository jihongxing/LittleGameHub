/**
 * Reward Service
 * Manages reward catalog and redemptions
 * T075: Implement RewardService with redemption logic
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Reward, RewardType, RewardAvailabilityStatus } from '../entities/reward.entity';
import { Redemption, DeliveryStatus } from '../entities/redemption.entity';
import { PointService } from '../../points/services/point.service';

export interface GetRewardsOptions {
  type?: RewardType;
  min_points?: number;
  max_points?: number;
  featured?: boolean;
}

export interface RedeemRewardResponse {
  redemption_id: string;
  points_spent: number;
  new_balance: number;
  delivery_status: DeliveryStatus;
  confirmation_code: string;
}

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);

  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(Redemption)
    private readonly redemptionRepository: Repository<Redemption>,
    private readonly pointService: PointService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get available rewards
   */
  async getRewards(options: GetRewardsOptions = {}): Promise<{ rewards: Reward[] }> {
    const { type, min_points, max_points, featured } = options;

    const query = this.rewardRepository
      .createQueryBuilder('reward')
      .where('reward.availability_status = :status', {
        status: RewardAvailabilityStatus.AVAILABLE,
      });

    if (type) {
      query.andWhere('reward.reward_type = :type', { type });
    }

    if (min_points !== undefined) {
      query.andWhere('reward.point_cost >= :min_points', { min_points });
    }

    if (max_points !== undefined) {
      query.andWhere('reward.point_cost <= :max_points', { max_points });
    }

    if (featured) {
      query.andWhere('reward.is_featured = :featured', { featured });
    }

    // Check validity dates
    const now = new Date();
    query.andWhere(
      '(reward.valid_from IS NULL OR reward.valid_from <= :now)',
      { now }
    );
    query.andWhere(
      '(reward.valid_until IS NULL OR reward.valid_until >= :now)',
      { now }
    );

    query.orderBy('reward.is_featured', 'DESC');
    query.addOrderBy('reward.point_cost', 'ASC');

    const rewards = await query.getMany();

    return { rewards: rewards.filter((r) => r.isAvailable()) };
  }

  /**
   * Get reward by ID
   */
  async getRewardById(rewardId: string): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new NotFoundException(`Reward ${rewardId} not found`);
    }

    return reward;
  }

  /**
   * Redeem a reward
   */
  async redeemReward(
    userId: string,
    rewardId: string,
    confirmation: boolean,
  ): Promise<RedeemRewardResponse> {
    if (!confirmation) {
      throw new BadRequestException('Confirmation is required');
    }

    return this.dataSource.transaction(async (manager) => {
      // Get reward with lock
      const reward = await manager.findOne(Reward, {
        where: { id: rewardId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!reward) {
        throw new NotFoundException(`Reward ${rewardId} not found`);
      }

      // Check if reward is available
      if (!reward.isAvailable()) {
        throw new BadRequestException('Reward is not available');
      }

      // Check if user has sufficient points
      const balance = await this.pointService.getBalance(userId);
      if (balance.balance < reward.pointCost) {
        throw new BadRequestException('Insufficient points');
      }

      // Deduct points
      const transaction = await this.pointService.deductPoints(
        userId,
        reward.pointCost,
        'redemption',
        reward.id,
        `Redeemed: ${reward.name}`,
      );

      // Decrement stock
      reward.decrementStock();
      await manager.save(reward);

      // Create redemption record
      const redemption = manager.create(Redemption, {
        userId,
        rewardId,
        pointsSpent: reward.pointCost,
        redemptionDate: new Date(),
        deliveryStatus: DeliveryStatus.PENDING,
        confirmationCode: Redemption.generateConfirmationCode(),
      });

      await manager.save(redemption);

      // Process delivery based on reward type
      await this.processRewardDelivery(manager, redemption, reward);

      const newBalance = await this.pointService.getBalance(userId);

      this.logger.log(
        `User ${userId} redeemed reward ${rewardId} for ${reward.pointCost} points`
      );

      return {
        redemption_id: redemption.id,
        points_spent: reward.pointCost,
        new_balance: newBalance.balance,
        delivery_status: redemption.deliveryStatus,
        confirmation_code: redemption.confirmationCode!,
      };
    });
  }

  /**
   * Process reward delivery
   */
  private async processRewardDelivery(
    manager: any,
    redemption: Redemption,
    reward: Reward,
  ): Promise<void> {
    switch (reward.rewardType) {
      case RewardType.MEMBERSHIP_TRIAL:
        // TODO: Activate membership trial
        redemption.updateDeliveryStatus(DeliveryStatus.PROCESSING);
        break;

      case RewardType.VIRTUAL_ITEM:
        // TODO: Add virtual item to user inventory
        redemption.updateDeliveryStatus(DeliveryStatus.DELIVERED);
        break;

      case RewardType.CASH:
      case RewardType.COUPON:
        // Requires manual processing
        redemption.updateDeliveryStatus(DeliveryStatus.PENDING);
        break;

      default:
        redemption.updateDeliveryStatus(DeliveryStatus.PENDING);
    }

    await manager.save(redemption);
  }

  /**
   * Get user's redemption history
   */
  async getRedemptionHistory(
    userId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<{ redemptions: Redemption[]; total: number }> {
    const { page = 1, limit = 20 } = options;

    const [redemptions, total] = await this.redemptionRepository.findAndCount({
      where: { userId },
      order: { redemptionDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['reward'],
    });

    return { redemptions, total };
  }

  /**
   * Create reward (admin function)
   */
  async createReward(rewardData: Partial<Reward>): Promise<Reward> {
    const reward = this.rewardRepository.create(rewardData);
    await this.rewardRepository.save(reward);
    this.logger.log(`Created reward: ${reward.id} - ${reward.name}`);
    return reward;
  }

  /**
   * Update reward (admin function)
   */
  async updateReward(rewardId: string, rewardData: Partial<Reward>): Promise<Reward> {
    const reward = await this.getRewardById(rewardId);
    Object.assign(reward, rewardData);
    await this.rewardRepository.save(reward);
    this.logger.log(`Updated reward: ${rewardId}`);
    return reward;
  }
}
