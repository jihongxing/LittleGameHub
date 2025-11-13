/**
 * Database Migration: Create Collections and Offline Tables (User Story 7)
 * T180: Migration for GameCollection, CollectionItem, and OfflineGame tables
 */

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCollectionsOffline1699999999008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create game_collections table
    await queryRunner.createTable(
      new Table({
        name: 'game_collections',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'cover_image_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'sort_order',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'game_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'last_updated_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for game_collections
    await queryRunner.createIndex(
      'game_collections',
      new TableIndex({
        name: 'IDX_game_collections_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'game_collections',
      new TableIndex({
        name: 'IDX_game_collections_user_name',
        columnNames: ['user_id', 'name'],
      }),
    );

    // Create foreign key for game_collections
    await queryRunner.createForeignKey(
      'game_collections',
      new TableForeignKey({
        name: 'FK_game_collections_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Create collection_items table
    await queryRunner.createTable(
      new Table({
        name: 'collection_items',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'collection_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'game_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'note',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sort_order',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'tags',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'added_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for collection_items
    await queryRunner.createIndex(
      'collection_items',
      new TableIndex({
        name: 'IDX_collection_items_collection_id',
        columnNames: ['collection_id'],
      }),
    );

    await queryRunner.createIndex(
      'collection_items',
      new TableIndex({
        name: 'IDX_collection_items_game_id',
        columnNames: ['game_id'],
      }),
    );

    await queryRunner.createIndex(
      'collection_items',
      new TableIndex({
        name: 'IDX_collection_items_collection_game',
        columnNames: ['collection_id', 'game_id'],
        isUnique: true,
      }),
    );

    // Create foreign keys for collection_items
    await queryRunner.createForeignKey(
      'collection_items',
      new TableForeignKey({
        name: 'FK_collection_items_collection',
        columnNames: ['collection_id'],
        referencedTableName: 'game_collections',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'collection_items',
      new TableForeignKey({
        name: 'FK_collection_items_game',
        columnNames: ['game_id'],
        referencedTableName: 'games',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Create offline_games table
    await queryRunner.createTable(
      new Table({
        name: 'offline_games',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'game_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'download_status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'downloaded_bytes',
            type: 'bigint',
            default: 0,
            isNullable: false,
          },
          {
            name: 'progress_percentage',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'storage_path',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'checksum',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'download_started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'download_completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_played_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'play_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'game_version',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for offline_games
    await queryRunner.createIndex(
      'offline_games',
      new TableIndex({
        name: 'IDX_offline_games_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'offline_games',
      new TableIndex({
        name: 'IDX_offline_games_game_id',
        columnNames: ['game_id'],
      }),
    );

    await queryRunner.createIndex(
      'offline_games',
      new TableIndex({
        name: 'IDX_offline_games_user_game',
        columnNames: ['user_id', 'game_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'offline_games',
      new TableIndex({
        name: 'IDX_offline_games_download_status',
        columnNames: ['download_status'],
      }),
    );

    // Create foreign keys for offline_games
    await queryRunner.createForeignKey(
      'offline_games',
      new TableForeignKey({
        name: 'FK_offline_games_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'offline_games',
      new TableForeignKey({
        name: 'FK_offline_games_game',
        columnNames: ['game_id'],
        referencedTableName: 'games',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop offline_games table
    await queryRunner.dropTable('offline_games', true);

    // Drop collection_items table
    await queryRunner.dropTable('collection_items', true);

    // Drop game_collections table
    await queryRunner.dropTable('game_collections', true);
  }
}

