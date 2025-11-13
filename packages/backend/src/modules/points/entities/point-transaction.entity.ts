/**
 * PointTransaction Entity
 * Represents a point earning or spending event
 * T068: Create PointTransaction entity model
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  EARN = 'earn',
  SPEND = 'spend',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

@Entity('point_transactions')
@Index(['userId', 'createdAt'])
@Index(['userId', 'transactionType'])
export class PointTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    name: 'transaction_type',
  })
  transactionType: TransactionType;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 100 })
  source: string;

  @Column({ type: 'uuid', name: 'source_id', nullable: true })
  sourceId: string | null;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  @Index()
  status: TransactionStatus;

  @Column({ type: 'int', name: 'balance_after' })
  balanceAfter: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Validate transaction
   */
  validate(): void {
    if (this.amount === 0) {
      throw new Error('Transaction amount cannot be zero');
    }

    if (this.transactionType === TransactionType.EARN && this.amount < 0) {
      throw new Error('Earn transactions must have positive amount');
    }

    if (this.transactionType === TransactionType.SPEND && this.amount > 0) {
      throw new Error('Spend transactions must have negative amount');
    }

    if (this.balanceAfter < 0) {
      throw new Error('Balance cannot be negative');
    }
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    return {
      id: this.id,
      user_id: this.userId,
      type: this.transactionType,
      amount: this.amount,
      source: this.source,
      source_id: this.sourceId,
      description: this.description,
      status: this.status,
      balance_after: this.balanceAfter,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}

