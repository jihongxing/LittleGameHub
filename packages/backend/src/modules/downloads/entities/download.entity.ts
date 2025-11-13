/**
 * Download Entity
 * Represents user's game downloads
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
import { Game } from '../../games/entities/game.entity';

export enum DownloadStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

@Entity('downloads')
@Index(['userId'])
@Index(['gameId'])
@Index(['status'])
export class Download {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  gameId: string;

  @Column({
    type: 'enum',
    enum: DownloadStatus,
    default: DownloadStatus.PENDING,
  })
  status: DownloadStatus;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number | null;

  @Column({ type: 'bigint', default: 0 })
  downloadedSize: number;

  @Column({ type: 'int', nullable: true })
  downloadSpeed: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  downloadUrl: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Game, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
