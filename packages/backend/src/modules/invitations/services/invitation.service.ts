/**
 * Invitation Service
 * Handles invitation link generation and tracking
 * T124: Implement InvitationService with link generation and tracking
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThan } from 'typeorm';
import { Invitation, InvitationStatus } from '../entities/invitation.entity';
import { User } from '../../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

export interface GenerateInvitationResponse {
  invitation_id: string;
  invitation_code: string;
  invitation_link: string;
  qr_code_url: string;
}

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
  }

  /**
   * Generate invitation link for user
   */
  async generateInvitation(userId: string): Promise<GenerateInvitationResponse> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate unique code
    let invitationCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      invitationCode = Invitation.generateCode();
      const existing = await this.invitationRepository.findOne({
        where: { invitationCode },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new BadRequestException('Failed to generate unique invitation code');
    }

    // Create invitation link
    const invitationLink = `${this.baseUrl}/register?invite=${invitationCode}`;

    // Set expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create invitation
    const invitation = this.invitationRepository.create({
      inviterId: userId,
      invitationCode,
      invitationLink,
      status: InvitationStatus.PENDING,
      expiresAt,
      rewardMilestones: {},
    });

    await this.invitationRepository.save(invitation);

    this.logger.log(`Generated invitation ${invitationCode} for user ${userId}`);

    // Generate QR code URL
    const qrCodeUrl = `${this.baseUrl}/api/invitations/qr/${invitationCode}`;

    return {
      invitation_id: invitation.id,
      invitation_code: invitationCode,
      invitation_link: invitationLink,
      qr_code_url: qrCodeUrl,
    };
  }

  /**
   * Get invitation by code
   */
  async getInvitationByCode(code: string): Promise<Invitation | null> {
    return this.invitationRepository.findOne({
      where: { invitationCode: code },
    });
  }

  /**
   * Accept invitation (called during registration)
   */
  async acceptInvitation(
    code: string,
    inviteeId: string,
    ip?: string,
    fingerprint?: string,
  ): Promise<Invitation> {
    const invitation = await this.getInvitationByCode(code);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (!invitation.isValid()) {
      throw new BadRequestException('Invitation is expired or already used');
    }

    // Accept invitation
    invitation.accept(inviteeId, ip, fingerprint);
    await this.invitationRepository.save(invitation);

    this.logger.log(`Invitation ${code} accepted by user ${inviteeId}`);

    return invitation;
  }

  /**
   * Get user's invitations
   */
  async getUserInvitations(userId: string, options: {
    status?: InvitationStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<{ invitations: Invitation[]; total: number }> {
    const { status, page = 1, limit = 20 } = options;

    const query = this.invitationRepository
      .createQueryBuilder('invitation')
      .where('invitation.inviter_id = :userId', { userId });

    if (status) {
      query.andWhere('invitation.status = :status', { status });
    }

    query.orderBy('invitation.created_at', 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [invitations, total] = await query.getManyAndCount();

    return { invitations, total };
  }

  /**
   * Get invitation statistics for user
   */
  async getUserInvitationStats(userId: string): Promise<{
    total_invitations: number;
    accepted_invitations: number;
    pending_invitations: number;
    total_points_earned: number;
    conversion_rate: number;
  }> {
    const stats = await this.invitationRepository
      .createQueryBuilder('invitation')
      .select('COUNT(*)', 'total')
      .addSelect(
        "COUNT(CASE WHEN status = 'accepted' OR status = 'rewarded' THEN 1 END)",
        'accepted',
      )
      .addSelect(
        "COUNT(CASE WHEN status = 'pending' THEN 1 END)",
        'pending',
      )
      .addSelect('SUM(points_awarded)', 'points')
      .where('invitation.inviter_id = :userId', { userId })
      .getRawOne();

    const total = parseInt(stats.total) || 0;
    const accepted = parseInt(stats.accepted) || 0;
    const pending = parseInt(stats.pending) || 0;
    const points = parseInt(stats.points) || 0;
    const conversionRate = total > 0 ? (accepted / total) * 100 : 0;

    return {
      total_invitations: total,
      accepted_invitations: accepted,
      pending_invitations: pending,
      total_points_earned: points,
      conversion_rate: Math.round(conversionRate * 100) / 100,
    };
  }

  /**
   * Get top inviters (leaderboard)
   */
  async getTopInviters(limit: number = 10): Promise<Array<{
    user_id: string;
    total_invitations: number;
    total_points: number;
    rank: number;
  }>> {
    const results = await this.invitationRepository
      .createQueryBuilder('invitation')
      .select('invitation.inviter_id', 'user_id')
      .addSelect('COUNT(*)', 'total_invitations')
      .addSelect('SUM(invitation.points_awarded)', 'total_points')
      .where("invitation.status IN ('accepted', 'rewarded')")
      .groupBy('invitation.inviter_id')
      .orderBy('total_points', 'DESC')
      .addOrderBy('total_invitations', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((result, index) => ({
      user_id: result.user_id,
      total_invitations: parseInt(result.total_invitations),
      total_points: parseInt(result.total_points) || 0,
      rank: index + 1,
    }));
  }

  /**
   * Clean up expired invitations (cron job)
   */
  async expireOldInvitations(): Promise<number> {
    const result = await this.invitationRepository.update(
      {
        status: InvitationStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
      {
        status: InvitationStatus.EXPIRED,
      },
    );

    this.logger.log(`Expired ${result.affected || 0} invitations`);
    return result.affected || 0;
  }
}

