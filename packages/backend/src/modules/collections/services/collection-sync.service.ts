/**
 * Collection Sync Service (User Story 7)
 * T184: Service for syncing collections across devices
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameCollection } from '../entities/game-collection.entity';
import { CollectionItem } from '../entities/collection-item.entity';

@Injectable()
export class CollectionSyncService {
  constructor(
    @InjectRepository(GameCollection)
    private readonly collectionRepository: Repository<GameCollection>,
    @InjectRepository(CollectionItem)
    private readonly itemRepository: Repository<CollectionItem>,
  ) {}

  /**
   * Get sync data for a user's collections
   */
  async getSyncData(userId: number, lastSyncTime?: Date): Promise<{
    collections: GameCollection[];
    items: CollectionItem[];
    sync_timestamp: Date;
  }> {
    const queryBuilder = this.collectionRepository
      .createQueryBuilder('collection')
      .where('collection.user_id = :userId', { userId });

    if (lastSyncTime) {
      queryBuilder.andWhere('collection.updated_at > :lastSyncTime', { lastSyncTime });
    }

    const collections = await queryBuilder.getMany();

    // Get collection IDs
    const collectionIds = collections.map((c) => c.id);

    // Get items for these collections
    let items: CollectionItem[] = [];
    if (collectionIds.length > 0) {
      const itemQueryBuilder = this.itemRepository
        .createQueryBuilder('item')
        .where('item.collection_id IN (:...collectionIds)', { collectionIds });

      if (lastSyncTime) {
        itemQueryBuilder.andWhere('item.added_at > :lastSyncTime', { lastSyncTime });
      }

      items = await itemQueryBuilder.getMany();
    }

    return {
      collections,
      items,
      sync_timestamp: new Date(),
    };
  }

  /**
   * Apply sync data from another device
   */
  async applySyncData(
    userId: number,
    collections: Partial<GameCollection>[],
    items: Partial<CollectionItem>[],
  ): Promise<void> {
    // Merge collections
    for (const collectionData of collections) {
      if (collectionData.id) {
        // Update existing collection
        const existing = await this.collectionRepository.findOne({
          where: { id: collectionData.id, user_id: userId },
        });

        if (existing) {
          Object.assign(existing, collectionData);
          await this.collectionRepository.save(existing);
        }
      } else {
        // Create new collection
        const newCollection = this.collectionRepository.create({
          ...collectionData,
          user_id: userId,
        });
        await this.collectionRepository.save(newCollection);
      }
    }

    // Merge items
    for (const itemData of items) {
      if (itemData.id) {
        // Update existing item
        const existing = await this.itemRepository.findOne({
          where: { id: itemData.id },
        });

        if (existing) {
          Object.assign(existing, itemData);
          await this.itemRepository.save(existing);
        }
      } else {
        // Create new item
        const newItem = this.itemRepository.create(itemData);
        await this.itemRepository.save(newItem);
      }
    }
  }
}

