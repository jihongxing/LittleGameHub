/**
 * Game Entity
 * Represents a mini-game available on the platform
 * T042: Create Game entity model
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { GameSession } from './game-session.entity';

export enum GameAvailabilityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum Genre {
  ACTION = 'action',
  ADVENTURE = 'adventure',
  PUZZLE = 'puzzle',
  STRATEGY = 'strategy',
  SIMULATION = 'simulation',
  SPORTS = 'sports',
  RACING = 'racing',
  CASUAL = 'casual',
}

export enum Platform {
  WEB = 'web',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  ALL = 'all',
}

export interface PointRewardRules {
  base_points: number;
  min_duration_seconds: number;
  points_per_minute: number;
  max_points_per_session: number;
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 500, name: 'cover_image_url' })
  coverImageUrl: string;

  @Column({ type: 'varchar', length: 500, name: 'game_url' })
  gameUrl: string;

  @Column({ type: 'jsonb', name: 'category_tags', default: [] })
  categoryTags: string[];

  @Column({ type: 'jsonb', name: 'point_reward_rules' })
  pointRewardRules: PointRewardRules;

  @Column({ type: 'int', name: 'min_play_duration_seconds', default: 180 })
  minPlayDurationSeconds: number;

  @Column({
    type: 'enum',
    enum: GameAvailabilityStatus,
    name: 'availability_status',
    default: GameAvailabilityStatus.ACTIVE,
  })
  availabilityStatus: GameAvailabilityStatus;

  @Column({ type: 'boolean', name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ type: 'int', name: 'play_count', default: 0 })
  playCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, name: 'average_rating', nullable: true })
  averageRating: number | null;

  @Column({ type: 'varchar', length: 20, default: '1.0.0' })
  version: string;

  @Column({ type: 'uuid', name: 'developer_id', nullable: true })
  developerId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => GameSession, (session) => session.game)
  sessions: GameSession[];

  /**
   * Calculate points earned for a game session
   * @param durationSeconds Duration of play in seconds
   * @param membershipMultiplier Membership point multiplier (default 1.0)
   * @returns Points earned
   */
  calculatePoints(durationSeconds: number, membershipMultiplier: number = 1.0): number {
    // No points if duration is less than minimum
    if (durationSeconds < this.pointRewardRules.min_duration_seconds) {
      return 0;
    }

    // Base points
    let points = this.pointRewardRules.base_points;

    // Add points based on duration
    const durationMinutes = Math.floor(durationSeconds / 60);
    points += durationMinutes * this.pointRewardRules.points_per_minute;

    // Apply membership multiplier
    points = Math.floor(points * membershipMultiplier);

    // Cap at maximum
    return Math.min(points, this.pointRewardRules.max_points_per_session);
  }

  /**
   * Check if game is playable
   */
  isPlayable(): boolean {
    return this.availabilityStatus === GameAvailabilityStatus.ACTIVE;
  }

  /**
   * Increment play count
   */
  incrementPlayCount(): void {
    this.playCount += 1;
  }

  /**
   * Update average rating
   * @param newRating New rating (1-5)
   * @param totalRatings Total number of ratings
   */
  updateAverageRating(newRating: number, totalRatings: number): void {
    if (this.averageRating === null) {
      this.averageRating = newRating;
    } else {
      // Calculate weighted average
      this.averageRating = 
        (this.averageRating * (totalRatings - 1) + newRating) / totalRatings;
    }
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      cover_image_url: this.coverImageUrl,
      game_url: this.gameUrl,
      category_tags: this.categoryTags,
      point_reward_rules: this.pointRewardRules,
      min_play_duration_seconds: this.minPlayDurationSeconds,
      availability_status: this.availabilityStatus,
      is_featured: this.isFeatured,
      play_count: this.playCount,
      average_rating: this.averageRating,
      version: this.version,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}

