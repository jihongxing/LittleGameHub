/**
 * Achievement Entity (User Story 8)
 * T205: Create Achievement entity model
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  category: string; // gameplay, social, collection, points, membership

  @Column({ type: 'varchar', length: 100 })
  trigger_type: string; // game_play_count, points_earned, friends_count, etc.

  @Column({ type: 'integer' })
  trigger_threshold: number;

  @Column({ type: 'integer', default: 0 })
  points_reward: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon_url: string;

  @Column({
    type: 'enum',
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common',
  })
  rarity: string;

  @Column({ type: 'boolean', default: false })
  is_hidden: boolean;

  @Column({ type: 'integer', default: 0 })
  display_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  user_id: number;

  @Column({ type: 'integer' })
  achievement_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  unlocked_at: Date;

  @Column({ type: 'integer', default: 0 })
  progress: number; // For tracking partial progress

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Additional data like score, time, etc.

  @CreateDateColumn()
  created_at: Date;
}

