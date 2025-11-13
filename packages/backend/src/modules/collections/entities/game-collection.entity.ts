/**
 * Game Collection Entity (User Story 7)
 * T177: Entity model for game collections
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { CollectionItem } from './collection-item.entity';

@Entity('game_collections')
@Index(['user_id'])
@Index(['user_id', 'name'])
export class GameCollection {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Owner of the collection
   */
  @Column({ type: 'integer' })
  user_id: number;

  /**
   * Collection name
   */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /**
   * Collection description
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Whether the collection is public or private
   */
  @Column({ type: 'boolean', default: false })
  is_public: boolean;

  /**
   * Collection cover image URL (optional)
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  cover_image_url?: string;

  /**
   * Collection category or tag
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string;

  /**
   * Sort order for display
   */
  @Column({ type: 'integer', default: 0 })
  sort_order: number;

  /**
   * Number of games in the collection (cached)
   */
  @Column({ type: 'integer', default: 0 })
  game_count: number;

  /**
   * Last time a game was added to the collection
   */
  @Column({ type: 'timestamp', nullable: true })
  last_updated_at?: Date;

  /**
   * Relationship to collection items
   */
  @OneToMany(() => CollectionItem, (item) => item.collection)
  items: CollectionItem[];

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

