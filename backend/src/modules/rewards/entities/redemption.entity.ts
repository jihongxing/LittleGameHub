/**
 * Redemption Entity
 * Represents a point redemption transaction
 * T070: Create Redemption entity model
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Reward } from './reward.entity';

export enum DeliveryStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

@Entity('redemptions')
export class Redemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'reward_id' })
  rewardId: string;

  @Column({ type: 'int', name: 'points_spent' })
  pointsSpent: number;

  @Column({ type: 'timestamp', name: 'redemption_date' })
  redemptionDate: Date;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    name: 'delivery_status',
    default: DeliveryStatus.PENDING,
  })
  deliveryStatus: DeliveryStatus;

  @Column({ type: 'jsonb', name: 'delivery_data', nullable: true })
  deliveryData: Record<string, any> | null;

  @Column({ type: 'varchar', length: 50, name: 'confirmation_code', nullable: true })
  confirmationCode: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Reward, (reward) => reward.redemptions)
  @JoinColumn({ name: 'reward_id' })
  reward: Reward;

  /**
   * Generate confirmation code
   */
  static generateConfirmationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Update delivery status
   */
  updateDeliveryStatus(status: DeliveryStatus, data?: Record<string, any>): void {
    this.deliveryStatus = status;
    if (data) {
      this.deliveryData = { ...this.deliveryData, ...data };
    }
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    return {
      id: this.id,
      user_id: this.userId,
      reward_id: this.rewardId,
      points_spent: this.pointsSpent,
      redemption_date: this.redemptionDate,
      delivery_status: this.deliveryStatus,
      delivery_data: this.deliveryData,
      confirmation_code: this.confirmationCode,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}

