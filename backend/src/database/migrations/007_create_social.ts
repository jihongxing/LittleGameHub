/**
 * Database Migration: Create Social Tables (User Story 6)
 * T157: Migration for FriendRelationship and GameChallenge tables
 */

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateSocial1699999999007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create friend_relationships table
    await queryRunner.createTable(
      new Table({
        name: 'friend_relationships',
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
            name: 'friend_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'nickname',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'accepted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_interaction_at',
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

    // Create indexes for friend_relationships
    await queryRunner.createIndex(
      'friend_relationships',
      new TableIndex({
        name: 'IDX_friend_relationships_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'friend_relationships',
      new TableIndex({
        name: 'IDX_friend_relationships_friend_id',
        columnNames: ['friend_id'],
      }),
    );

    await queryRunner.createIndex(
      'friend_relationships',
      new TableIndex({
        name: 'IDX_friend_relationships_user_friend',
        columnNames: ['user_id', 'friend_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'friend_relationships',
      new TableIndex({
        name: 'IDX_friend_relationships_user_status',
        columnNames: ['user_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'friend_relationships',
      new TableIndex({
        name: 'IDX_friend_relationships_friend_status',
        columnNames: ['friend_id', 'status'],
      }),
    );

    // Create foreign keys for friend_relationships (assuming users table exists)
    await queryRunner.createForeignKey(
      'friend_relationships',
      new TableForeignKey({
        name: 'FK_friend_relationships_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'friend_relationships',
      new TableForeignKey({
        name: 'FK_friend_relationships_friend',
        columnNames: ['friend_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Create game_challenges table
    await queryRunner.createTable(
      new Table({
        name: 'game_challenges',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'challenger_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'challenged_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'game_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'challenge_type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'target_value',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'challenger_score',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'challenged_score',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'winner_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rewards',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'accepted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
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

    // Create indexes for game_challenges
    await queryRunner.createIndex(
      'game_challenges',
      new TableIndex({
        name: 'IDX_game_challenges_challenger_id',
        columnNames: ['challenger_id'],
      }),
    );

    await queryRunner.createIndex(
      'game_challenges',
      new TableIndex({
        name: 'IDX_game_challenges_challenged_id',
        columnNames: ['challenged_id'],
      }),
    );

    await queryRunner.createIndex(
      'game_challenges',
      new TableIndex({
        name: 'IDX_game_challenges_game_id',
        columnNames: ['game_id'],
      }),
    );

    await queryRunner.createIndex(
      'game_challenges',
      new TableIndex({
        name: 'IDX_game_challenges_challenger_status',
        columnNames: ['challenger_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'game_challenges',
      new TableIndex({
        name: 'IDX_game_challenges_challenged_status',
        columnNames: ['challenged_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'game_challenges',
      new TableIndex({
        name: 'IDX_game_challenges_game_status',
        columnNames: ['game_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'game_challenges',
      new TableIndex({
        name: 'IDX_game_challenges_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    // Create foreign keys for game_challenges
    await queryRunner.createForeignKey(
      'game_challenges',
      new TableForeignKey({
        name: 'FK_game_challenges_challenger',
        columnNames: ['challenger_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'game_challenges',
      new TableForeignKey({
        name: 'FK_game_challenges_challenged',
        columnNames: ['challenged_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'game_challenges',
      new TableForeignKey({
        name: 'FK_game_challenges_game',
        columnNames: ['game_id'],
        referencedTableName: 'games',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'game_challenges',
      new TableForeignKey({
        name: 'FK_game_challenges_winner',
        columnNames: ['winner_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop game_challenges table
    await queryRunner.dropTable('game_challenges', true);

    // Drop friend_relationships table
    await queryRunner.dropTable('friend_relationships', true);
  }
}

