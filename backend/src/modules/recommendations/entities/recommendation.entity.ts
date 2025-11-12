/**
 * Recommendation Entity
 * Stores game recommendation records for users
 * T140: Create Recommendation entity model
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RecommendationType {
  POPULAR = 'popular',
  SIMILAR = 'similar',
  PERSONALIZED = 'personalized',
  SCENARIO = 'scenario',
  TRENDING = 'trending',
}

export enum RecommendationScenario {
  COMMUTE = 'commute',
  BREAK_TIME = 'break_time',
  BEDTIME = 'bedtime',
  WEEKEND = 'weekend',
  ANY = 'any',
}

@Entity('recommendations')
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // User ID (null for global recommendations)
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  // Recommended game ID
  @Column({ name: 'game_id', type: 'uuid' })
  gameId: string;

  // Recommendation type
  @Column({
    name: 'recommendation_type',
    type: 'varchar',
    length: 20,
  })
  recommendationType: RecommendationType;

  // Scenario
  @Column({
    name: 'scenario',
    type: 'varchar',
    length: 20,
    default: RecommendationScenario.ANY,
  })
  scenario: RecommendationScenario;

  // Recommendation score (0-100)
  @Column({ name: 'score', type: 'float', default: 0 })
  score: number;

  // Reason for recommendation
  @Column({ name: 'reason', type: 'text', nullable: true })
  reason: string | null;

  // Metadata (algorithm details, factors, etc.)
  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  // Whether user interacted with recommendation
  @Column({ name: 'clicked', type: 'boolean', default: false })
  clicked: boolean;

  // Whether user played the game after recommendation
  @Column({ name: 'played', type: 'boolean', default: false })
  played: boolean;

  // Expiration date
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Check if recommendation is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  /**
   * Mark as clicked
   */
  markClicked(): void {
    this.clicked = true;
  }

  /**
   * Mark as played
   */
  markPlayed(): void {
    this.played = true;
    this.clicked = true;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      user_id: this.userId,
      game_id: this.gameId,
      recommendation_type: this.recommendationType,
      scenario: this.scenario,
      score: this.score,
      reason: this.reason,
      metadata: this.metadata,
      clicked: this.clicked,
      played: this.played,
      expires_at: this.expiresAt,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}

