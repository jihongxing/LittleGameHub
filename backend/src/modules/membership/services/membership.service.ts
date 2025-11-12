/**
 * Membership Service
 * Manages membership subscriptions and privileges
 * T100: Implement MembershipService with subscription and privilege logic
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { Membership, MembershipTier, MembershipStatus } from '../entities/membership.entity';
import { User } from '../../users/entities/user.entity';

export interface MembershipPlan {
  tier: MembershipTier;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  features: string[];
  point_multiplier: number;
}

export interface SubscriptionResult {
  membership_id: string;
  tier: MembershipTier;
  status: MembershipStatus;
  start_date: Date;
  end_date: Date;
  payment_required: boolean;
  payment_amount?: number;
}

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  // Membership plans configuration
  private readonly MEMBERSHIP_PLANS: MembershipPlan[] = [
    {
      tier: MembershipTier.BASIC,
      name: '基础会员',
      description: '享受免广告和积分加成',
      price: 15,
      duration_months: 1,
      features: [
        '无广告体验',
        '1.2倍积分加成',
        '优先客服',
      ],
      point_multiplier: 1.2,
    },
    {
      tier: MembershipTier.PREMIUM,
      name: '高级会员',
      description: '解锁全部游戏和云存档',
      price: 30,
      duration_months: 1,
      features: [
        '无广告体验',
        '1.5倍积分加成',
        '解锁全部游戏',
        '云存档功能',
        '优先客服',
        '专属徽章',
      ],
      point_multiplier: 1.5,
    },
    {
      tier: MembershipTier.VIP,
      name: '离线会员',
      description: '支持游戏离线下载',
      price: 50,
      duration_months: 1,
      features: [
        '无广告体验',
        '2倍积分加成',
        '解锁全部游戏',
        '云存档功能',
        '离线游戏下载 (20GB)',
        '优先客服',
        '专属徽章',
        '优先体验新游戏',
      ],
      point_multiplier: 2.0,
    },
  ];

  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get available membership plans
   */
  getPlans(): MembershipPlan[] {
    return this.MEMBERSHIP_PLANS;
  }

  /**
   * Get plan by tier
   */
  getPlanByTier(tier: MembershipTier): MembershipPlan | null {
    return this.MEMBERSHIP_PLANS.find((plan) => plan.tier === tier) || null;
  }

  /**
   * Get user's current membership
   */
  async getCurrentMembership(userId: string): Promise<Membership | null> {
    const membership = await this.membershipRepository.findOne({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        endDate: MoreThan(new Date()),
      },
      order: { endDate: 'DESC' },
    });

    return membership;
  }

  /**
   * Check if user has active membership
   */
  async hasActiveMembership(userId: string): Promise<boolean> {
    const membership = await this.getCurrentMembership(userId);
    return membership !== null && membership.isActive();
  }

  /**
   * Get user's membership tier
   */
  async getMembershipTier(userId: string): Promise<MembershipTier | null> {
    const membership = await this.getCurrentMembership(userId);
    return membership?.tier || null;
  }

  /**
   * Get point multiplier for user
   */
  async getPointMultiplier(userId: string): Promise<number> {
    const tier = await this.getMembershipTier(userId);
    if (!tier) {
      return 1.0; // Default multiplier for no membership
    }
    const plan = this.getPlanByTier(tier);
    return plan?.point_multiplier || 1.0;
  }

  /**
   * Check if user has specific privilege
   */
  async hasPrivilege(userId: string, privilege: string): Promise<boolean> {
    const membership = await this.getCurrentMembership(userId);
    if (!membership) {
      return false;
    }

    const plan = this.getPlanByTier(membership.tier);
    if (!plan) {
      return false;
    }

    // Check if privilege is in features
    const privilegeMap: Record<string, string[]> = {
      ad_free: ['无广告体验'],
      cloud_save: ['云存档功能'],
      offline_download: ['离线游戏下载'],
      priority_support: ['优先客服'],
      exclusive_badge: ['专属徽章'],
      all_games: ['解锁全部游戏'],
      early_access: ['优先体验新游戏'],
    };

    const requiredFeatures = privilegeMap[privilege] || [];
    return requiredFeatures.every((feature) => plan.features.includes(feature));
  }

  /**
   * Create or renew membership subscription
   */
  async subscribe(
    userId: string,
    tier: MembershipTier,
    paymentId?: string,
  ): Promise<SubscriptionResult> {
    const plan = this.getPlanByTier(tier);
    if (!plan) {
      throw new BadRequestException(`Invalid membership tier: ${tier}`);
    }

    return this.dataSource.transaction(async (manager) => {
      // Get user
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check for existing active membership
      const existingMembership = await manager.findOne(Membership, {
        where: {
          userId,
          status: MembershipStatus.ACTIVE,
          endDate: MoreThan(new Date()),
        },
      });

      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (existingMembership) {
        // Extend existing membership
        startDate = existingMembership.endDate || new Date();
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + plan.duration_months);

        existingMembership.endDate = endDate;
        existingMembership.autoRenew = true;
        await manager.save(existingMembership);

        this.logger.log(`Extended membership for user ${userId} to ${endDate}`);

        return {
          membership_id: existingMembership.id,
          tier: existingMembership.tier,
          status: existingMembership.status,
          start_date: existingMembership.startDate,
          end_date: endDate,
          payment_required: true,
          payment_amount: plan.price,
        };
      } else {
        // Create new membership
        startDate = now;
        endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + plan.duration_months);

        const membership = manager.getRepository(Membership).create({
          userId,
          tier,
          status: paymentId ? MembershipStatus.ACTIVE : MembershipStatus.PENDING,
          startDate,
          endDate,
          autoRenew: true,
          paymentMethod: paymentId ? 'alipay' : undefined,
        });

        await manager.save(membership);

        this.logger.log(`Created new membership for user ${userId}: ${tier}`);

        return {
          membership_id: membership.id,
          tier: membership.tier,
          status: membership.status,
          start_date: startDate,
          end_date: endDate,
          payment_required: !paymentId,
          payment_amount: plan.price,
        };
      }
    });
  }

  /**
   * Cancel membership subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    const membership = await this.getCurrentMembership(userId);
    if (!membership) {
      throw new NotFoundException('No active membership found');
    }

    membership.autoRenew = false;
    membership.status = MembershipStatus.CANCELLED;
    await this.membershipRepository.save(membership);

    this.logger.log(`Cancelled membership for user ${userId}`);
  }

  /**
   * Activate membership after payment
   */
  async activateMembership(membershipId: string, paymentId: string): Promise<Membership> {
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.status === MembershipStatus.ACTIVE) {
      return membership;
    }

    membership.status = MembershipStatus.ACTIVE;
    membership.paymentMethod = 'alipay'; // or determine from paymentId
    await this.membershipRepository.save(membership);

    this.logger.log(`Activated membership ${membershipId} with payment ${paymentId}`);

    return membership;
  }

  /**
   * Expire memberships (cron job)
   */
  async expireMemberships(): Promise<number> {
    const expiredMemberships = await this.membershipRepository.find({
      where: {
        status: MembershipStatus.ACTIVE,
        endDate: MoreThan(new Date()),
      },
    });

    let expiredCount = 0;
    for (const membership of expiredMemberships) {
      if (membership.endDate && new Date() > membership.endDate) {
        membership.status = MembershipStatus.EXPIRED;
        await this.membershipRepository.save(membership);
        expiredCount++;
      }
    }

    this.logger.log(`Expired ${expiredCount} memberships`);
    return expiredCount;
  }

  /**
   * Get membership history
   */
  async getMembershipHistory(userId: string): Promise<Membership[]> {
    return this.membershipRepository.find({
      where: { userId },
      order: { startDate: 'DESC' },
    });
  }
}

