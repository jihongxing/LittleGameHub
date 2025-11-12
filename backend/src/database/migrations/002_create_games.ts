/**
 * Migration: Create Game and GameSession tables
 * T044: Create database migration for Game and GameSession tables
 */

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateGames1699800000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create games table
    await queryRunner.createTable(
      new Table({
        name: 'games',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'cover_image_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'game_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'category_tags',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'point_reward_rules',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'min_play_duration_seconds',
            type: 'int',
            default: 180,
            isNullable: false,
          },
          {
            name: 'availability_status',
            type: 'enum',
            enum: ['active', 'inactive', 'maintenance'],
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'is_featured',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'play_count',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'average_rating',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'version',
            type: 'varchar',
            length: '20',
            default: "'1.0.0'",
            isNullable: false,
          },
          {
            name: 'developer_id',
            type: 'uuid',
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
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes for games table
    await queryRunner.createIndex(
      'games',
      new TableIndex({
        name: 'IDX_games_availability_status',
        columnNames: ['availability_status'],
      })
    );

    await queryRunner.createIndex(
      'games',
      new TableIndex({
        name: 'IDX_games_is_featured',
        columnNames: ['is_featured'],
      })
    );

    await queryRunner.createIndex(
      'games',
      new TableIndex({
        name: 'IDX_games_play_count',
        columnNames: ['play_count'],
      })
    );

    // Create GIN index for JSONB category_tags
    await queryRunner.query(
      'CREATE INDEX "IDX_games_category_tags" ON "games" USING GIN ("category_tags")'
    );

    // Create game_sessions table
    await queryRunner.createTable(
      new Table({
        name: 'game_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'game_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'start_time',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'end_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'duration_seconds',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'points_earned',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'completion_status',
            type: 'enum',
            enum: ['in_progress', 'completed', 'abandoned'],
            default: "'in_progress'",
            isNullable: false,
          },
          {
            name: 'game_state',
            type: 'jsonb',
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
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes for game_sessions table
    await queryRunner.createIndex(
      'game_sessions',
      new TableIndex({
        name: 'IDX_game_sessions_user_id',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'game_sessions',
      new TableIndex({
        name: 'IDX_game_sessions_game_id',
        columnNames: ['game_id'],
      })
    );

    await queryRunner.createIndex(
      'game_sessions',
      new TableIndex({
        name: 'IDX_game_sessions_completion_status',
        columnNames: ['completion_status'],
      })
    );

    await queryRunner.createIndex(
      'game_sessions',
      new TableIndex({
        name: 'IDX_game_sessions_user_game_start',
        columnNames: ['user_id', 'game_id', 'start_time'],
      })
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'game_sessions',
      new TableForeignKey({
        name: 'FK_game_sessions_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'game_sessions',
      new TableForeignKey({
        name: 'FK_game_sessions_game',
        columnNames: ['game_id'],
        referencedTableName: 'games',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('game_sessions', 'FK_game_sessions_game');
    await queryRunner.dropForeignKey('game_sessions', 'FK_game_sessions_user');

    // Drop indexes for game_sessions
    await queryRunner.dropIndex('game_sessions', 'IDX_game_sessions_user_game_start');
    await queryRunner.dropIndex('game_sessions', 'IDX_game_sessions_completion_status');
    await queryRunner.dropIndex('game_sessions', 'IDX_game_sessions_game_id');
    await queryRunner.dropIndex('game_sessions', 'IDX_game_sessions_user_id');

    // Drop game_sessions table
    await queryRunner.dropTable('game_sessions');

    // Drop indexes for games
    await queryRunner.dropIndex('games', 'IDX_games_category_tags');
    await queryRunner.dropIndex('games', 'IDX_games_play_count');
    await queryRunner.dropIndex('games', 'IDX_games_is_featured');
    await queryRunner.dropIndex('games', 'IDX_games_availability_status');

    // Drop games table
    await queryRunner.dropTable('games');
  }
}

