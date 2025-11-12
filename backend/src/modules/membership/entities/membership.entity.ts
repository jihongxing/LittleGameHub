/**
 * Membership Entity
 * Task: T098
 * 
 * Represents a user's membership subscription with payment and privilege information
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PlanType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  OFFLINE_MONTHLY = 'offline_monthly',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum MembershipStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
  REFUNDED = 'refunded',
}

export enum MembershipTier {
  BASIC = 'basic',
  PREMIUM = 'premium',
  VIP = 'vip',
}

@Entity('memberships')
@Index(['userId'], { unique: true })
@Index(['expirationDate'])
@Index(['paymentStatus'])
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  planType: PlanType;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  expirationDate: Date;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentTransactionId: string | null;

  @Column({ type: 'boolean', default: false })
  autoRenew: boolean;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.PENDING,
  })
  status: MembershipStatus;

  @Column({
    type: 'enum',
    enum: MembershipTier,
    default: MembershipTier.BASIC,
  })
  tier: MembershipTier;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Check if membership is currently active
   */
  isActive(): boolean {
    return (
      this.paymentStatus === PaymentStatus.PAID &&
      this.expirationDate > new Date()
    );
  }

  /**
   * Check if membership is expiring soon (within specified days)
   */
  isExpiringSoon(daysThreshold: number = 7): boolean {
    const now = new Date();
    const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
    return this.expirationDate <= threshold && this.expirationDate > now;
  }

  /**
   * Get point multiplier based on plan type
   */
  getPointMultiplier(): number {
    switch (this.planType) {
      case PlanType.MONTHLY:
        return 1.3; // 30% bonus
      case PlanType.QUARTERLY:
        return 1.5; // 50% bonus
      case PlanType.YEARLY:
        return 2.0; // 100% bonus
      case PlanType.OFFLINE_MONTHLY:
        return 1.3; // 30% bonus
      default:
        return 1.0;
    }
  }

  /**
   * Get plan details
   */
  getPlanDetails(): {
    name: string;
    duration_days: number;
    benefits: string[];
  } {
    switch (this.planType) {
      case PlanType.MONTHLY:
        return {
          name: 'Monthly Membership',
          duration_days: 30,
          benefits: [
            'Ad-free experience',
            '30% point multiplier',
            'Priority access to new games',
          ],
        };
      case PlanType.QUARTERLY:
        return {
          name: 'Quarterly Membership',
          duration_days: 90,
          benefits: [
            'Ad-free experience',
            '50% point multiplier',
            'Priority access to new games',
            'Cloud save functionality',
          ],
        };
      case PlanType.YEARLY:
        return {
          name: 'Yearly Membership',
          duration_days: 365,
          benefits: [
            'Ad-free experience',
            '100% point multiplier',
            'Priority access to new games',
            'Cloud save functionality',
            'Exclusive games access',
          ],
        };
      case PlanType.OFFLINE_MONTHLY:
        return {
          name: 'Offline Monthly Membership',
          duration_days: 30,
          benefits: [
            'Ad-free experience',
            '30% point multiplier',
            'Priority access to new games',
            'Offline game downloads (20GB storage)',
          ],
        };
      default:
        return {
          name: 'Unknown Plan',
          duration_days: 0,
          benefits: [],
        };
    }
  }
}

