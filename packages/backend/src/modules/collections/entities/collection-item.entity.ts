/**
 * Collection Item Entity (User Story 7)
 * T178: Entity model for items in game collections
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GameCollection } from './game-collection.entity';

@Entity('collection_items')
@Index(['collection_id', 'game_id'], { unique: true })
@Index(['collection_id'])
@Index(['game_id'])
export class CollectionItem {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Collection this item belongs to
   */
  @Column({ type: 'integer' })
  collection_id: number;

  /**
   * Game ID
   */
  @Column({ type: 'integer' })
  game_id: number;

  /**
   * User's personal note about this game in the collection
   */
  @Column({ type: 'text', nullable: true })
  note?: string;

  /**
   * Sort order within the collection
   */
  @Column({ type: 'integer', default: 0 })
  sort_order: number;

  /**
   * Custom tags for this item
   */
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  /**
   * When the game was added to the collection
   */
  @CreateDateColumn()
  added_at: Date;

  /**
   * Relationship to collection
   */
  @ManyToOne(() => GameCollection, (collection) => collection.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collection_id' })
  collection: GameCollection;
}

