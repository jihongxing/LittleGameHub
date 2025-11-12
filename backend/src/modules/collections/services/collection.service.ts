/**
 * Game Collection Service (User Story 7)
 * T181: Service for managing game collections with CRUD operations
 */

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameCollection } from '../entities/game-collection.entity';
import { CollectionItem } from '../entities/collection-item.entity';

export interface CreateCollectionDto {
  user_id: number;
  name: string;
  description?: string;
  is_public?: boolean;
  cover_image_url?: string;
  category?: string;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  is_public?: boolean;
  cover_image_url?: string;
  category?: string;
  sort_order?: number;
}

export interface GetCollectionsQuery {
  user_id: number;
  is_public?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class GameCollectionService {
  constructor(
    @InjectRepository(GameCollection)
    private readonly collectionRepository: Repository<GameCollection>,
    @InjectRepository(CollectionItem)
    private readonly itemRepository: Repository<CollectionItem>,
  ) {}

  /**
   * Get all collections for a user
   */
  async getCollections(query: GetCollectionsQuery): Promise<{
    collections: GameCollection[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { user_id, is_public, page = 1, limit = 20 } = query;

    const queryBuilder = this.collectionRepository
      .createQueryBuilder('collection')
      .where('collection.user_id = :user_id', { user_id });

    if (typeof is_public === 'boolean') {
      queryBuilder.andWhere('collection.is_public = :is_public', { is_public });
    }

    queryBuilder.orderBy('collection.sort_order', 'ASC').addOrderBy('collection.created_at', 'DESC');

    const total = await queryBuilder.getCount();
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const collections = await queryBuilder.getMany();

    return { collections, total, page, limit };
  }

  /**
   * Get a single collection by ID
   */
  async getCollectionById(id: number, userId: number): Promise<GameCollection> {
    const collection = await this.collectionRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    return collection;
  }

  /**
   * Create a new collection
   */
  async createCollection(dto: CreateCollectionDto): Promise<GameCollection> {
    // Validate name length
    if (dto.name.length > 100) {
      throw new BadRequestException('Collection name is too long (max 100 characters)');
    }

    // Create collection
    const collection = this.collectionRepository.create({
      ...dto,
      is_public: dto.is_public ?? false,
      game_count: 0,
    });

    return await this.collectionRepository.save(collection);
  }

  /**
   * Update a collection
   */
  async updateCollection(
    id: number,
    userId: number,
    dto: UpdateCollectionDto,
  ): Promise<GameCollection> {
    const collection = await this.getCollectionById(id, userId);

    // Update fields
    if (dto.name) collection.name = dto.name;
    if (dto.description !== undefined) collection.description = dto.description;
    if (dto.is_public !== undefined) collection.is_public = dto.is_public;
    if (dto.cover_image_url !== undefined) collection.cover_image_url = dto.cover_image_url;
    if (dto.category !== undefined) collection.category = dto.category;
    if (dto.sort_order !== undefined) collection.sort_order = dto.sort_order;

    return await this.collectionRepository.save(collection);
  }

  /**
   * Delete a collection
   */
  async deleteCollection(id: number, userId: number): Promise<void> {
    const collection = await this.getCollectionById(id, userId);
    await this.collectionRepository.remove(collection);
  }

  /**
   * Add a game to a collection
   */
  async addGameToCollection(
    collectionId: number,
    gameId: number,
    userId: number,
    note?: string,
  ): Promise<CollectionItem> {
    // Verify collection ownership
    await this.getCollectionById(collectionId, userId);

    // Check if game already in collection
    const existingItem = await this.itemRepository.findOne({
      where: { collection_id: collectionId, game_id: gameId },
    });

    if (existingItem) {
      throw new ConflictException('Game already in collection');
    }

    // Create collection item
    const item = this.itemRepository.create({
      collection_id: collectionId,
      game_id: gameId,
      note,
    });

    const savedItem = await this.itemRepository.save(item);

    // Update game count
    await this.updateGameCount(collectionId);

    return savedItem;
  }

  /**
   * Remove a game from a collection
   */
  async removeGameFromCollection(
    collectionId: number,
    gameId: number,
    userId: number,
  ): Promise<void> {
    // Verify collection ownership
    await this.getCollectionById(collectionId, userId);

    const item = await this.itemRepository.findOne({
      where: { collection_id: collectionId, game_id: gameId },
    });

    if (!item) {
      throw new NotFoundException('Game not found in collection');
    }

    await this.itemRepository.remove(item);

    // Update game count
    await this.updateGameCount(collectionId);
  }

  /**
   * Get games in a collection
   */
  async getCollectionGames(
    collectionId: number,
    userId: number,
  ): Promise<CollectionItem[]> {
    // Verify collection ownership or public access
    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.user_id !== userId && !collection.is_public) {
      throw new BadRequestException('Cannot access private collection');
    }

    return await this.itemRepository.find({
      where: { collection_id: collectionId },
      order: { sort_order: 'ASC', added_at: 'DESC' },
    });
  }

  /**
   * Update game count for a collection
   */
  private async updateGameCount(collectionId: number): Promise<void> {
    const count = await this.itemRepository.count({
      where: { collection_id: collectionId },
    });

    await this.collectionRepository.update(
      { id: collectionId },
      { game_count: count, last_updated_at: new Date() },
    );
  }

  /**
   * Get public collections
   */
  async getPublicCollections(page = 1, limit = 20): Promise<{
    collections: GameCollection[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.collectionRepository
      .createQueryBuilder('collection')
      .where('collection.is_public = :is_public', { is_public: true })
      .andWhere('collection.game_count > 0')
      .orderBy('collection.game_count', 'DESC')
      .addOrderBy('collection.created_at', 'DESC');

    const total = await queryBuilder.getCount();
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const collections = await queryBuilder.getMany();

    return { collections, total, page, limit };
  }
}

