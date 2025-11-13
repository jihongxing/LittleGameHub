/**
 * Invitation Entity
 * Tracks user invitation relationships and rewards
 * T122: Create Invitation entity model
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REWARDED = 'rewarded',
  EXPIRED = 'expired',
}

export enum InvitationRewardType {
  REGISTRATION = 'registration',
  FIRST_GAME = 'first_game',
  FIRST_REDEMPTION = 'first_redemption',
  MEMBERSHIP_PURCHASE = 'membership_purchase',
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Inviter user ID
  @Column({ name: 'inviter_id', type: 'uuid' })
  inviterId: string;

  // Invitee user ID (null until accepted)
  @Column({ name: 'invitee_id', type: 'uuid', nullable: true })
  inviteeId: string | null;

  // Unique invitation code
  @Column({ name: 'invitation_code', type: 'varchar', length: 32, unique: true })
  invitationCode: string;

  // Invitation status
  @Column({
    type: 'varchar',
    length: 20,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  // Invitation link
  @Column({ name: 'invitation_link', type: 'text' })
  invitationLink: string;

  // Points awarded to inviter
  @Column({ name: 'points_awarded', type: 'integer', default: 0 })
  pointsAwarded: number;

  // Reward milestones completed
  @Column({ name: 'reward_milestones', type: 'jsonb', default: {} })
  rewardMilestones: Record<InvitationRewardType, boolean>;

  // Expiration date (optional)
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  // IP address of invitee (for fraud detection)
  @Column({ name: 'invitee_ip', type: 'varchar', length: 45, nullable: true })
  inviteeIp: string | null;

  // Device fingerprint (for fraud detection)
  @Column({ name: 'device_fingerprint', type: 'varchar', length: 255, nullable: true })
  deviceFingerprint: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Generate a unique invitation code
   */
  static generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Check if invitation is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  /**
   * Check if invitation is valid
   */
  isValid(): boolean {
    return (
      this.status === InvitationStatus.PENDING &&
      !this.isExpired()
    );
  }

  /**
   * Mark as accepted
   */
  accept(inviteeId: string, ip?: string, fingerprint?: string): void {
    this.inviteeId = inviteeId;
    this.status = InvitationStatus.ACCEPTED;
    this.inviteeIp = ip || null;
    this.deviceFingerprint = fingerprint || null;
  }

  /**
   * Complete a reward milestone
   */
  completeRewardMilestone(type: InvitationRewardType, points: number): void {
    if (!this.rewardMilestones) {
      this.rewardMilestones = {} as Record<InvitationRewardType, boolean>;
    }
    this.rewardMilestones[type] = true;
    this.pointsAwarded += points;
  }

  /**
   * Check if milestone is completed
   */
  isMilestoneCompleted(type: InvitationRewardType): boolean {
    return this.rewardMilestones?.[type] === true;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      inviter_id: this.inviterId,
      invitee_id: this.inviteeId,
      invitation_code: this.invitationCode,
      invitation_link: this.invitationLink,
      status: this.status,
      points_awarded: this.pointsAwarded,
      reward_milestones: this.rewardMilestones,
      expires_at: this.expiresAt,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}

