/**
 * Migration: Create PointTransaction, Reward, and Redemption tables
 * T071: Create database migration for PointTransaction, Reward, and Redemption tables
 */

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePointsRewards1699900000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create point_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'point_transactions',
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
            name: 'transaction_type',
            type: 'enum',
            enum: ['earn', 'spend'],
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'source',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'source_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'completed', 'failed', 'reversed'],
            default: "'completed'",
            isNullable: false,
          },
          {
            name: 'balance_after',
            type: 'int',
            isNullable: false,
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

    // Indexes for point_transactions
    await queryRunner.createIndex(
      'point_transactions',
      new TableIndex({
        name: 'IDX_point_transactions_user_id',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'point_transactions',
      new TableIndex({
        name: 'IDX_point_transactions_source',
        columnNames: ['source'],
      })
    );

    await queryRunner.createIndex(
      'point_transactions',
      new TableIndex({
        name: 'IDX_point_transactions_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'point_transactions',
      new TableIndex({
        name: 'IDX_point_transactions_user_created',
        columnNames: ['user_id', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'point_transactions',
      new TableIndex({
        name: 'IDX_point_transactions_user_type',
        columnNames: ['user_id', 'transaction_type'],
      })
    );

    // Foreign key for point_transactions
    await queryRunner.createForeignKey(
      'point_transactions',
      new TableForeignKey({
        name: 'FK_point_transactions_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Create rewards table
    await queryRunner.createTable(
      new Table({
        name: 'rewards',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
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
            name: 'point_cost',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'reward_type',
            type: 'enum',
            enum: ['membership_trial', 'cash', 'virtual_item', 'coupon'],
            isNullable: false,
          },
          {
            name: 'reward_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'availability_status',
            type: 'enum',
            enum: ['available', 'out_of_stock', 'disabled'],
            default: "'available'",
            isNullable: false,
          },
          {
            name: 'stock_quantity',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'total_redeemed',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'is_featured',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'valid_from',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'valid_until',
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
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Indexes for rewards
    await queryRunner.createIndex(
      'rewards',
      new TableIndex({
        name: 'IDX_rewards_availability_status',
        columnNames: ['availability_status'],
      })
    );

    await queryRunner.createIndex(
      'rewards',
      new TableIndex({
        name: 'IDX_rewards_point_cost',
        columnNames: ['point_cost'],
      })
    );

    await queryRunner.createIndex(
      'rewards',
      new TableIndex({
        name: 'IDX_rewards_is_featured',
        columnNames: ['is_featured'],
      })
    );

    await queryRunner.createIndex(
      'rewards',
      new TableIndex({
        name: 'IDX_rewards_reward_type',
        columnNames: ['reward_type'],
      })
    );

    // Create redemptions table
    await queryRunner.createTable(
      new Table({
        name: 'redemptions',
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
            name: 'reward_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'points_spent',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'redemption_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'delivery_status',
            type: 'enum',
            enum: ['pending', 'processing', 'delivered', 'failed'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'delivery_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'confirmation_code',
            type: 'varchar',
            length: '50',
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

    // Indexes for redemptions
    await queryRunner.createIndex(
      'redemptions',
      new TableIndex({
        name: 'IDX_redemptions_user_id',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'redemptions',
      new TableIndex({
        name: 'IDX_redemptions_reward_id',
        columnNames: ['reward_id'],
      })
    );

    await queryRunner.createIndex(
      'redemptions',
      new TableIndex({
        name: 'IDX_redemptions_delivery_status',
        columnNames: ['delivery_status'],
      })
    );

    await queryRunner.createIndex(
      'redemptions',
      new TableIndex({
        name: 'IDX_redemptions_redemption_date',
        columnNames: ['redemption_date'],
      })
    );

    // Foreign keys for redemptions
    await queryRunner.createForeignKey(
      'redemptions',
      new TableForeignKey({
        name: 'FK_redemptions_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'redemptions',
      new TableForeignKey({
        name: 'FK_redemptions_reward',
        columnNames: ['reward_id'],
        referencedTableName: 'rewards',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    // Update users table to add point_balance column if not exists
    const usersTable = await queryRunner.getTable('users');
    const pointBalanceColumn = usersTable?.findColumnByName('point_balance');
    
    if (!pointBalanceColumn) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD COLUMN point_balance INT DEFAULT 0 NOT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('redemptions', 'FK_redemptions_reward');
    await queryRunner.dropForeignKey('redemptions', 'FK_redemptions_user');
    await queryRunner.dropForeignKey('point_transactions', 'FK_point_transactions_user');

    // Drop indexes for redemptions
    await queryRunner.dropIndex('redemptions', 'IDX_redemptions_redemption_date');
    await queryRunner.dropIndex('redemptions', 'IDX_redemptions_delivery_status');
    await queryRunner.dropIndex('redemptions', 'IDX_redemptions_reward_id');
    await queryRunner.dropIndex('redemptions', 'IDX_redemptions_user_id');

    // Drop redemptions table
    await queryRunner.dropTable('redemptions');

    // Drop indexes for rewards
    await queryRunner.dropIndex('rewards', 'IDX_rewards_reward_type');
    await queryRunner.dropIndex('rewards', 'IDX_rewards_is_featured');
    await queryRunner.dropIndex('rewards', 'IDX_rewards_point_cost');
    await queryRunner.dropIndex('rewards', 'IDX_rewards_availability_status');

    // Drop rewards table
    await queryRunner.dropTable('rewards');

    // Drop indexes for point_transactions
    await queryRunner.dropIndex('point_transactions', 'IDX_point_transactions_user_type');
    await queryRunner.dropIndex('point_transactions', 'IDX_point_transactions_user_created');
    await queryRunner.dropIndex('point_transactions', 'IDX_point_transactions_status');
    await queryRunner.dropIndex('point_transactions', 'IDX_point_transactions_source');
    await queryRunner.dropIndex('point_transactions', 'IDX_point_transactions_user_id');

    // Drop point_transactions table
    await queryRunner.dropTable('point_transactions');

    // Remove point_balance column from users table
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS point_balance
    `);
  }
}
