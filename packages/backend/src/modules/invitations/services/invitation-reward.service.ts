/**
 * Invitation Reward Service
 * Handles invitation reward calculation and distribution
 * T125: Implement invitation reward calculation and distribution
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation, InvitationRewardType, InvitationStatus } from '../entities/invitation.entity';
import { PointService } from '../../points/services/point.service';

export interface RewardMilestone {
  type: InvitationRewardType;
  points: number;
  description: string;
}

@Injectable()
export class InvitationRewardService {
  private readonly logger = new Logger(InvitationRewardService.name);

  // Reward configuration
  private readonly REWARD_MILESTONES: RewardMilestone[] = [
    {
      type: InvitationRewardType.REGISTRATION,
      points: 50,
      description: '好友注册成功',
    },
    {
      type: InvitationRewardType.FIRST_GAME,
      points: 100,
      description: '好友首次游玩游戏',
    },
    {
      type: InvitationRewardType.FIRST_REDEMPTION,
      points: 150,
      description: '好友首次兑换奖励',
    },
    {
      type: InvitationRewardType.MEMBERSHIP_PURCHASE,
      points: 500,
      description: '好友购买会员',
    },
  ];

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    private readonly pointService: PointService,
  ) {}

  /**
   * Get reward milestones configuration
   */
  getRewardMilestones(): RewardMilestone[] {
    return this.REWARD_MILESTONES;
  }

  /**
   * Award points for milestone completion
   */
  async awardMilestoneReward(
    invitationCode: string,
    milestoneType: InvitationRewardType,
  ): Promise<{ success: boolean; points_awarded: number }> {
    const invitation = await this.invitationRepository.findOne({
      where: { invitationCode },
    });

    if (!invitation) {
      this.logger.warn(`Invitation ${invitationCode} not found`);
      return { success: false, points_awarded: 0 };
    }

    // Check if invitation is accepted
    if (invitation.status === InvitationStatus.PENDING) {
      this.logger.warn(`Invitation ${invitationCode} not accepted yet`);
      return { success: false, points_awarded: 0 };
    }

    // Check if milestone already completed
    if (invitation.isMilestoneCompleted(milestoneType)) {
      this.logger.warn(`Milestone ${milestoneType} already completed for invitation ${invitationCode}`);
      return { success: false, points_awarded: 0 };
    }

    // Get reward amount
    const milestone = this.REWARD_MILESTONES.find((m) => m.type === milestoneType);
    if (!milestone) {
      this.logger.error(`Unknown milestone type: ${milestoneType}`);
      return { success: false, points_awarded: 0 };
    }

    try {
      // Award points to inviter
      await this.pointService.awardPoints(
        invitation.inviterId,
        milestone.points,
        'invitation_reward',
        invitation.id,
        `邀请奖励：${milestone.description}`,
      );

      // Mark milestone as completed
      invitation.completeRewardMilestone(milestoneType, milestone.points);
      
      // Update status to rewarded if all major milestones completed
      if (this.areAllMajorMilestonesCompleted(invitation)) {
        invitation.status = InvitationStatus.REWARDED;
      }

      await this.invitationRepository.save(invitation);

      this.logger.log(
        `Awarded ${milestone.points} points to user ${invitation.inviterId} for milestone ${milestoneType}`
      );

      return { success: true, points_awarded: milestone.points };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to award milestone reward: ${errorMessage}`);
      return { success: false, points_awarded: 0 };
    }
  }

  /**
   * Process registration reward
   */
  async processRegistrationReward(invitationCode: string): Promise<void> {
    await this.awardMilestoneReward(invitationCode, InvitationRewardType.REGISTRATION);
  }

  /**
   * Process first game reward
   */
  async processFirstGameReward(userId: string): Promise<void> {
    // Find invitation where user is invitee
    const invitation = await this.invitationRepository.findOne({
      where: { inviteeId: userId },
    });

    if (invitation) {
      await this.awardMilestoneReward(
        invitation.invitationCode,
        InvitationRewardType.FIRST_GAME,
      );
    }
  }

  /**
   * Process first redemption reward
   */
  async processFirstRedemptionReward(userId: string): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { inviteeId: userId },
    });

    if (invitation) {
      await this.awardMilestoneReward(
        invitation.invitationCode,
        InvitationRewardType.FIRST_REDEMPTION,
      );
    }
  }

  /**
   * Process membership purchase reward
   */
  async processMembershipPurchaseReward(userId: string): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { inviteeId: userId },
    });

    if (invitation) {
      await this.awardMilestoneReward(
        invitation.invitationCode,
        InvitationRewardType.MEMBERSHIP_PURCHASE,
      );
    }
  }

  /**
   * Check if all major milestones are completed
   */
  private areAllMajorMilestonesCompleted(invitation: Invitation): boolean {
    const majorMilestones = [
      InvitationRewardType.REGISTRATION,
      InvitationRewardType.FIRST_GAME,
    ];

    return majorMilestones.every((type) => invitation.isMilestoneCompleted(type));
  }

  /**
   * Get total potential rewards for an invitation
   */
  getTotalPotentialRewards(): number {
    return this.REWARD_MILESTONES.reduce((sum, milestone) => sum + milestone.points, 0);
  }

  /**
   * Calculate conversion value for user
   */
  async calculateUserConversionValue(userId: string): Promise<number> {
    const invitations = await this.invitationRepository.find({
      where: { inviteeId: userId },
    });

    if (invitations.length === 0) {
      return 0;
    }

    // Sum up all points awarded for this user's conversion
    return invitations.reduce((sum, inv) => sum + inv.pointsAwarded, 0);
  }
}

