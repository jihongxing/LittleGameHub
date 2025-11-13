/**
 * Offline Game Entity (User Story 7)
 * T179: Entity model for offline game downloads
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';

@Entity('offline_games')
@Index(['user_id', 'game_id'], { unique: true })
@Index(['user_id'])
@Index(['game_id'])
@Index(['download_status'])
export class OfflineGame {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * User who downloaded the game
   */
  @Column({ type: 'integer' })
  user_id: number;

  /**
   * Game ID
   */
  @Column({ type: 'integer' })
  game_id: number;

  /**
   * Download status
   * - pending: Download queued, not started
   * - downloading: Currently downloading
   * - completed: Download finished successfully
   * - failed: Download failed
   * - paused: Download paused by user
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  download_status: DownloadStatus;

  /**
   * File size in bytes
   */
  @Column({ type: 'bigint', nullable: true })
  file_size?: number;

  /**
   * Downloaded bytes (for progress tracking)
   */
  @Column({ type: 'bigint', default: 0 })
  downloaded_bytes: number;

  /**
   * Download progress percentage (0-100)
   */
  @Column({ type: 'integer', default: 0 })
  progress_percentage: number;

  /**
   * Storage path on server (or hash/reference)
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  storage_path?: string;

  /**
   * Checksum for integrity verification
   */
  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum?: string;

  /**
   * Download start time
   */
  @Column({ type: 'timestamp', nullable: true })
  download_started_at?: Date;

  /**
   * Download completion time
   */
  @Column({ type: 'timestamp', nullable: true })
  download_completed_at?: Date;

  /**
   * Last time the game was played offline
   */
  @Column({ type: 'timestamp', nullable: true })
  last_played_at?: Date;

  /**
   * Error message if download failed
   */
  @Column({ type: 'text', nullable: true })
  error_message?: string;

  /**
   * Number of times the game has been played offline
   */
  @Column({ type: 'integer', default: 0 })
  play_count: number;

  /**
   * Expiration date for offline access (for licensing)
   */
  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  /**
   * Version of the game downloaded
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  game_version?: string;

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

