/**
 * Friend Relationship Entity (User Story 6)
 * T155: Entity model for managing friend relationships
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

@Entity('friend_relationships')
@Index(['user_id', 'friend_id'], { unique: true })
@Index(['user_id', 'status'])
@Index(['friend_id', 'status'])
export class FriendRelationship {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * User who initiated the friend request
   */
  @Column({ type: 'integer' })
  user_id: number;

  /**
   * User who received the friend request
   */
  @Column({ type: 'integer' })
  friend_id: number;

  /**
   * Status of the friendship
   * - pending: Friend request sent, awaiting response
   * - accepted: Friend request accepted, users are friends
   * - rejected: Friend request rejected
   * - blocked: User blocked this friend
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: FriendshipStatus;

  /**
   * Custom nickname for the friend (optional)
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  nickname?: string;

  /**
   * Notes about this friend (optional, private)
   */
  @Column({ type: 'text', nullable: true })
  notes?: string;

  /**
   * Timestamp when the friend request was accepted
   */
  @Column({ type: 'timestamp', nullable: true })
  accepted_at?: Date;

  /**
   * Timestamp when the friendship was last interacted with
   */
  @Column({ type: 'timestamp', nullable: true })
  last_interaction_at?: Date;

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

