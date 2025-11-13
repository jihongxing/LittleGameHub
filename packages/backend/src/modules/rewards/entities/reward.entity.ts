/**
 * Reward Entity
 * Represents a redeemable reward item
 * T069: Create Reward entity model
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Redemption } from './redemption.entity';

export enum RewardType {
  MEMBERSHIP_TRIAL = 'membership_trial',
  CASH = 'cash',
  VIRTUAL_ITEM = 'virtual_item',
  COUPON = 'coupon',
}

export enum RewardAvailabilityStatus {
  AVAILABLE = 'available',
  OUT_OF_STOCK = 'out_of_stock',
  DISABLED = 'disabled',
}

@Entity('rewards')
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int', name: 'point_cost' })
  pointCost: number;

  @Column({
    type: 'enum',
    enum: RewardType,
    name: 'reward_type',
  })
  rewardType: RewardType;

  @Column({ type: 'jsonb', name: 'reward_data', nullable: true })
  rewardData: Record<string, any> | null;

  @Column({
    type: 'enum',
    enum: RewardAvailabilityStatus,
    name: 'availability_status',
    default: RewardAvailabilityStatus.AVAILABLE,
  })
  availabilityStatus: RewardAvailabilityStatus;

  @Column({ type: 'int', name: 'stock_quantity', nullable: true })
  stockQuantity: number | null;

  @Column({ type: 'int', name: 'total_redeemed', default: 0 })
  totalRedeemed: number;

  @Column({ type: 'boolean', name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ type: 'timestamp', name: 'valid_from', nullable: true })
  validFrom: Date | null;

  @Column({ type: 'timestamp', name: 'valid_until', nullable: true })
  validUntil: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Redemption, (redemption) => redemption.reward)
  redemptions: Redemption[];

  /**
   * Check if reward is available
   */
  isAvailable(): boolean {
    if (this.availabilityStatus !== RewardAvailabilityStatus.AVAILABLE) {
      return false;
    }

    if (this.stockQuantity !== null && this.stockQuantity <= 0) {
      return false;
    }

    const now = new Date();
    if (this.validFrom && now < this.validFrom) {
      return false;
    }

    if (this.validUntil && now > this.validUntil) {
      return false;
    }

    return true;
  }

  /**
   * Decrement stock quantity
   */
  decrementStock(): void {
    if (this.stockQuantity !== null) {
      this.stockQuantity -= 1;
      if (this.stockQuantity <= 0) {
        this.availabilityStatus = RewardAvailabilityStatus.OUT_OF_STOCK;
      }
    }
    this.totalRedeemed += 1;
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      point_cost: this.pointCost,
      reward_type: this.rewardType,
      reward_data: this.rewardData,
      availability_status: this.availabilityStatus,
      stock_quantity: this.stockQuantity,
      total_redeemed: this.totalRedeemed,
      is_featured: this.isFeatured,
      valid_from: this.validFrom,
      valid_until: this.validUntil,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}

