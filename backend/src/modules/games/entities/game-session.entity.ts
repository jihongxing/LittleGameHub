/**
 * GameSession Entity
 * Represents a user's game play session
 * T043: Create GameSession entity model
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
import { Game } from './game.entity';

export enum GameSessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity('game_sessions')
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'game_id' })
  gameId: string;

  @Column({ type: 'timestamp', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamp', name: 'end_time', nullable: true })
  endTime: Date | null;

  @Column({ type: 'int', name: 'duration_seconds', nullable: true })
  durationSeconds: number | null;

  @Column({ type: 'int', name: 'points_earned', default: 0 })
  pointsEarned: number;

  @Column({
    type: 'enum',
    enum: GameSessionStatus,
    name: 'completion_status',
    default: GameSessionStatus.IN_PROGRESS,
  })
  completionStatus: GameSessionStatus;

  @Column({ type: 'jsonb', name: 'game_state', nullable: true })
  gameState: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Game, (game) => game.sessions)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  /**
   * Calculate session duration from start and end times
   * @returns Duration in seconds, or null if session is not ended
   */
  calculateDuration(): number | null {
    if (!this.endTime) {
      return null;
    }

    const durationMs = this.endTime.getTime() - this.startTime.getTime();
    return Math.floor(durationMs / 1000);
  }

  /**
   * End the game session
   * @param endTime End timestamp
   * @param status Completion status
   */
  endSession(endTime: Date, status: GameSessionStatus = GameSessionStatus.COMPLETED): void {
    this.endTime = endTime;
    this.completionStatus = status;
    this.durationSeconds = this.calculateDuration();
  }

  /**
   * Update game state (for cloud save)
   * @param state Game state object
   */
  updateGameState(state: Record<string, any>): void {
    this.gameState = state;
  }

  /**
   * Award points for this session
   * @param points Points to award
   */
  awardPoints(points: number): void {
    this.pointsEarned = points;
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.completionStatus === GameSessionStatus.IN_PROGRESS;
  }

  /**
   * Check if session qualifies for points
   * @param minDuration Minimum duration in seconds
   */
  qualifiesForPoints(minDuration: number): boolean {
    if (this.completionStatus !== GameSessionStatus.COMPLETED) {
      return false;
    }

    if (this.durationSeconds === null) {
      return false;
    }

    return this.durationSeconds >= minDuration;
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    return {
      id: this.id,
      user_id: this.userId,
      game_id: this.gameId,
      start_time: this.startTime,
      end_time: this.endTime,
      duration_seconds: this.durationSeconds,
      points_earned: this.pointsEarned,
      completion_status: this.completionStatus,
      game_state: this.gameState,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}

