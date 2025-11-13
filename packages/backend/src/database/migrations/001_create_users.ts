/**
 * Database Migration: Create Users and UserAuthMethods Tables
 * Task: T021
 * 
 * Creates the users and user_auth_methods tables with all necessary columns, indexes, and constraints
 */

import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateUsers1699800000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nickname',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'avatar',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'point_balance',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'membership_status',
            type: 'enum',
            enum: ['free', 'member', 'offline_member'],
            default: "'free'",
            isNullable: false,
          },
          {
            name: 'level',
            type: 'integer',
            default: 1,
            isNullable: false,
          },
          {
            name: 'experience_points',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'registration_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'last_active_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'deletion_requested_at',
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
      true
    );

    // Create unique partial indexes for email and phone
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_email_unique" 
      ON users (email) 
      WHERE email IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_phone_unique" 
      ON users (phone) 
      WHERE phone IS NOT NULL
    `);

    // Create regular indexes
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_membership_status',
        columnNames: ['membership_status'],
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_last_active_date',
        columnNames: ['last_active_date'],
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_is_deleted',
        columnNames: ['is_deleted'],
      })
    );

    // Create user_auth_methods table
    await queryRunner.createTable(
      new Table({
        name: 'user_auth_methods',
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
            name: 'auth_type',
            type: 'enum',
            enum: ['phone', 'email', 'wechat', 'qq', 'apple'],
            isNullable: false,
          },
          {
            name: 'auth_provider_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'provider_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_primary',
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

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'user_auth_methods',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    // Create indexes
    await queryRunner.createIndex(
      'user_auth_methods',
      new TableIndex({
        name: 'IDX_user_auth_methods_user_id',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'user_auth_methods',
      new TableIndex({
        name: 'IDX_user_auth_methods_auth_type_provider_id',
        columnNames: ['auth_type', 'auth_provider_id'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'user_auth_methods',
      new TableIndex({
        name: 'IDX_user_auth_methods_is_primary',
        columnNames: ['is_primary'],
      })
    );

    // Add table comments
    await queryRunner.query(`
      COMMENT ON TABLE users IS 'Platform users with authentication, profile, and account information';
      COMMENT ON TABLE user_auth_methods IS 'Authentication methods linked to user accounts';
    `);

    // Add column comments
    await queryRunner.query(`
      COMMENT ON COLUMN users.nickname IS 'User display name (2-50 characters)';
      COMMENT ON COLUMN users.point_balance IS 'Current point balance (cannot be negative)';
      COMMENT ON COLUMN users.membership_status IS 'Membership tier: free, member, offline_member';
      COMMENT ON COLUMN users.level IS 'User level in growth system';
      COMMENT ON COLUMN users.experience_points IS 'Experience points for leveling';
      COMMENT ON COLUMN users.is_deleted IS 'Soft delete flag (30-day grace period)';
      
      COMMENT ON COLUMN user_auth_methods.auth_type IS 'Authentication method type';
      COMMENT ON COLUMN user_auth_methods.auth_provider_id IS 'Provider-specific identifier (phone, email, social ID)';
      COMMENT ON COLUMN user_auth_methods.provider_data IS 'Additional provider-specific data (JSONB)';
      COMMENT ON COLUMN user_auth_methods.is_primary IS 'Primary authentication method flag (one per user)';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop user_auth_methods indexes
    await queryRunner.dropIndex('user_auth_methods', 'IDX_user_auth_methods_is_primary');
    await queryRunner.dropIndex('user_auth_methods', 'IDX_user_auth_methods_auth_type_provider_id');
    await queryRunner.dropIndex('user_auth_methods', 'IDX_user_auth_methods_user_id');

    // Drop foreign key
    const authMethodsTable = await queryRunner.getTable('user_auth_methods');
    const foreignKey = authMethodsTable!.foreignKeys.find(
      fk => fk.columnNames.indexOf('user_id') !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('user_auth_methods', foreignKey);
    }

    // Drop user_auth_methods table
    await queryRunner.dropTable('user_auth_methods');

    // Drop users indexes
    await queryRunner.dropIndex('users', 'IDX_users_is_deleted');
    await queryRunner.dropIndex('users', 'IDX_users_last_active_date');
    await queryRunner.dropIndex('users', 'IDX_users_membership_status');
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_phone_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email_unique"`);

    // Drop users table
    await queryRunner.dropTable('users');
  }
}
