/**
 * User Entity
 * Task: T019
 * 
 * Represents a platform user with authentication, profile, and account information
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserAuthMethod } from '../../auth/entities/user-auth-method.entity';

export enum MembershipStatus {
  FREE = 'free',
  MEMBER = 'member',
  OFFLINE_MEMBER = 'offline_member',
}

@Entity('users')
@Index(['email'], { unique: true, where: 'email IS NOT NULL' })
@Index(['phone'], { unique: true, where: 'phone IS NOT NULL' })
@Index(['membership_status'])
@Index(['last_active_date'])
@Index(['is_deleted'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  nickname: string;

  @Column({ type: 'text', nullable: true })
  avatar: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash: string | null;

  @Column({ type: 'integer', default: 0 })
  point_balance: number;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.FREE,
  })
  membership_status: MembershipStatus;

  @Column({ type: 'integer', default: 1 })
  level: number;

  @Column({ type: 'integer', default: 0 })
  experience_points: number;

  @Column({ type: 'timestamp' })
  registration_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_active_date: Date | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletion_requested_at: Date | null;

  @Column({ type: 'boolean', default: false })
  is_email_verified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email_verification_token: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_reset_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  password_reset_expires: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => UserAuthMethod, authMethod => authMethod.user)
  auth_methods: UserAuthMethod[];

  /**
   * Validate nickname format
   */
  static validateNickname(nickname: string): boolean {
    return nickname.length >= 2 && nickname.length <= 50;
  }

  /**
   * Check if user is a paying member
   */
  isPremiumMember(): boolean {
    return (
      this.membership_status === MembershipStatus.MEMBER ||
      this.membership_status === MembershipStatus.OFFLINE_MEMBER
    );
  }

  /**
   * Get point multiplier based on membership status
   */
  getPointMultiplier(): number {
    switch (this.membership_status) {
      case MembershipStatus.MEMBER:
      case MembershipStatus.OFFLINE_MEMBER:
        return 1.3; // Base multiplier for members
      default:
        return 1.0;
    }
  }

  /**
   * Update last active timestamp
   */
  updateLastActive(): void {
    this.last_active_date = new Date();
  }

  /**
   * Add points to user balance
   */
  addPoints(amount: number): void {
    if (amount < 0) {
      throw new Error('Cannot add negative points');
    }
    this.point_balance += amount;
  }

  /**
   * Deduct points from user balance
   */
  deductPoints(amount: number): boolean {
    if (amount < 0) {
      throw new Error('Cannot deduct negative points');
    }
    if (this.point_balance < amount) {
      return false; // Insufficient balance
    }
    this.point_balance -= amount;
    return true;
  }

  /**
   * Calculate level from experience points
   */
  static calculateLevel(experiencePoints: number): number {
    // Simple level calculation: level = floor(sqrt(experience / 100)) + 1
    return Math.floor(Math.sqrt(experiencePoints / 100)) + 1;
  }

  /**
   * Add experience and update level
   */
  addExperience(amount: number): void {
    this.experience_points += amount;
    this.level = User.calculateLevel(this.experience_points);
  }

  /**
   * Soft delete user account
   */
  requestDeletion(): void {
    this.is_deleted = true;
    this.deletion_requested_at = new Date();
    this.is_active = false;
  }

  /**
   * Cancel deletion request
   */
  cancelDeletion(): void {
    this.is_deleted = false;
    this.deletion_requested_at = null;
    this.is_active = true;
  }

  /**
   * Check if user account is expired for deletion (30 days after request)
   */
  isDeletionExpired(): boolean {
    if (!this.deletion_requested_at) {
      return false;
    }
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.deletion_requested_at <= thirtyDaysAgo;
  }
}
