/**
 * Database Migration: Create Membership Table
 * Task: T099
 * 
 * Creates the memberships table with all necessary columns, indexes, and constraints
 */

import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMembership1699800000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create memberships table
    await queryRunner.createTable(
      new Table({
        name: 'memberships',
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
            isNullable: false,
          },
          {
            name: 'plan_type',
            type: 'enum',
            enum: ['monthly', 'quarterly', 'yearly', 'offline_monthly'],
            isNullable: false,
          },
          {
            name: 'start_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'expiration_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'payment_status',
            type: 'enum',
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'payment_method',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'payment_transaction_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'auto_renew',
            type: 'boolean',
            default: false,
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
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create foreign key constraint to users table
    await queryRunner.createForeignKey(
      'memberships',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Create unique index on user_id (one membership per user)
    await queryRunner.createIndex(
      'memberships',
      new TableIndex({
        name: 'IDX_membership_user_id_unique',
        columnNames: ['user_id'],
        isUnique: true,
      })
    );

    // Create index on expiration_date for efficient expiration queries
    await queryRunner.createIndex(
      'memberships',
      new TableIndex({
        name: 'IDX_membership_expiration_date',
        columnNames: ['expiration_date'],
      })
    );

    // Create index on payment_status for filtering
    await queryRunner.createIndex(
      'memberships',
      new TableIndex({
        name: 'IDX_membership_payment_status',
        columnNames: ['payment_status'],
      })
    );

    // Add comment to table
    await queryRunner.query(`
      COMMENT ON TABLE memberships IS 'User membership subscriptions with payment and privilege information';
    `);

    // Add column comments
    await queryRunner.query(`
      COMMENT ON COLUMN memberships.user_id IS 'Reference to user who owns this membership';
      COMMENT ON COLUMN memberships.plan_type IS 'Type of membership plan: monthly, quarterly, yearly, offline_monthly';
      COMMENT ON COLUMN memberships.start_date IS 'Membership activation date';
      COMMENT ON COLUMN memberships.expiration_date IS 'Membership expiration date';
      COMMENT ON COLUMN memberships.payment_status IS 'Payment processing status: pending, paid, failed, refunded';
      COMMENT ON COLUMN memberships.payment_method IS 'Payment method used: wechat, alipay, apple_iap';
      COMMENT ON COLUMN memberships.payment_transaction_id IS 'Payment provider transaction ID';
      COMMENT ON COLUMN memberships.auto_renew IS 'Whether membership auto-renews on expiration';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('memberships', 'IDX_membership_payment_status');
    await queryRunner.dropIndex('memberships', 'IDX_membership_expiration_date');
    await queryRunner.dropIndex('memberships', 'IDX_membership_user_id_unique');

    // Drop foreign key
    const table = await queryRunner.getTable('memberships');
    const foreignKey = table!.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('memberships', foreignKey);
    }

    // Drop table
    await queryRunner.dropTable('memberships');
  }
}

