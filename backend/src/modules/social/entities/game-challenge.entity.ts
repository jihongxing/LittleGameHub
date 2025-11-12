/**
 * Game Challenge Entity (User Story 6)
 * T156: Entity model for managing game challenges between friends
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'expired';
export type ChallengeType = 'high_score' | 'time_attack' | 'completion' | 'custom';

@Entity('game_challenges')
@Index(['challenger_id', 'status'])
@Index(['challenged_id', 'status'])
@Index(['game_id', 'status'])
@Index(['expires_at'])
export class GameChallenge {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * User who initiated the challenge
   */
  @Column({ type: 'integer' })
  challenger_id: number;

  /**
   * User who received the challenge
   */
  @Column({ type: 'integer' })
  challenged_id: number;

  /**
   * Game ID for the challenge
   */
  @Column({ type: 'integer' })
  game_id: number;

  /**
   * Type of challenge
   * - high_score: Compete for highest score
   * - time_attack: Complete within time limit
   * - completion: First to complete the game
   * - custom: Custom challenge rules
   */
  @Column({ type: 'varchar', length: 20 })
  challenge_type: ChallengeType;

  /**
   * Status of the challenge
   * - pending: Challenge sent, awaiting response
   * - accepted: Challenge accepted, in progress
   * - declined: Challenge declined
   * - completed: Challenge completed
   * - expired: Challenge expired without completion
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: ChallengeStatus;

  /**
   * Target score or time (depending on challenge type)
   */
  @Column({ type: 'integer', nullable: true })
  target_value?: number;

  /**
   * Challenger's best score/time
   */
  @Column({ type: 'integer', nullable: true })
  challenger_score?: number;

  /**
   * Challenged user's best score/time
   */
  @Column({ type: 'integer', nullable: true })
  challenged_score?: number;

  /**
   * Winner of the challenge (user_id)
   */
  @Column({ type: 'integer', nullable: true })
  winner_id?: number;

  /**
   * Custom message or rules for the challenge
   */
  @Column({ type: 'text', nullable: true })
  message?: string;

  /**
   * Rewards for winning (points, badges, etc.)
   */
  @Column({ type: 'jsonb', nullable: true })
  rewards?: {
    points?: number;
    badge_id?: number;
    custom_reward?: string;
  };

  /**
   * Challenge expiration timestamp
   */
  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  /**
   * Timestamp when the challenge was accepted
   */
  @Column({ type: 'timestamp', nullable: true })
  accepted_at?: Date;

  /**
   * Timestamp when the challenge was completed
   */
  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  /**
   * Record creation timestamp
   */
  @CreateDateColumn()
  created_at: Date;

  /**
   * Record last update timestamp
   */
  @UpdateDateColumn()
  updated_at: Date;
}

