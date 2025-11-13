/**
 * Database Migration: Create Recommendations Table
 * T141: Create database migration for Recommendation table
 */

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRecommendations1700000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create recommendations table
    await queryRunner.createTable(
      new Table({
        name: 'recommendations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'game_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'recommendation_type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'scenario',
            type: 'varchar',
            length: '20',
            default: "'any'",
            isNullable: false,
          },
          {
            name: 'score',
            type: 'float',
            default: 0,
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'clicked',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'played',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'expires_at',
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

    // Create indexes
    await queryRunner.createIndex(
      'recommendations',
      new TableIndex({
        name: 'IDX_recommendations_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'recommendations',
      new TableIndex({
        name: 'IDX_recommendations_game_id',
        columnNames: ['game_id'],
      }),
    );

    await queryRunner.createIndex(
      'recommendations',
      new TableIndex({
        name: 'IDX_recommendations_type',
        columnNames: ['recommendation_type'],
      }),
    );

    await queryRunner.createIndex(
      'recommendations',
      new TableIndex({
        name: 'IDX_recommendations_scenario',
        columnNames: ['scenario'],
      }),
    );

    await queryRunner.createIndex(
      'recommendations',
      new TableIndex({
        name: 'IDX_recommendations_score',
        columnNames: ['score'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('recommendations');
  }
}

