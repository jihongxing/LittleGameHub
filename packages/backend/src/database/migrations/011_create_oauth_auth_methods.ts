/**
 * Database Migration: Create OAuth Auth Methods Table
 * Task: T070
 *
 * Creates the user_auth_methods table for storing OAuth provider authentication data
 * 创建user_auth_methods表用于存储OAuth提供商认证数据
 */

import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateOAuthAuthMethods1699900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_auth_methods table for OAuth authentication
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
            comment: '关联的用户ID',
          },
          {
            name: 'auth_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: '认证类型 (phone, email, wechat, github, google)',
          },
          {
            name: 'auth_provider_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: '第三方平台的用户ID',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: '第三方平台的邮箱',
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: '第三方平台的显示名称',
          },
          {
            name: 'avatar_url',
            type: 'text',
            isNullable: true,
            comment: '第三方平台的头像URL',
          },
          {
            name: 'access_token',
            type: 'text',
            isNullable: true,
            comment: '访问令牌',
          },
          {
            name: 'refresh_token',
            type: 'text',
            isNullable: true,
            comment: '刷新令牌',
          },
          {
            name: 'token_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            default: 'Bearer',
            comment: '令牌类型',
          },
          {
            name: 'scope',
            type: 'text',
            isNullable: true,
            comment: '授权范围',
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: '访问令牌过期时间',
          },
          {
            name: 'last_login_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: '最后登录时间',
          },
          {
            name: 'provider_data',
            type: 'jsonb',
            isNullable: true,
            comment: '提供商特定数据',
          },
          {
            name: 'is_primary',
            type: 'boolean',
            default: false,
            comment: '是否为主要登录方式',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'NOW()',
            comment: '创建时间',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'NOW()',
            comment: '更新时间',
          },
        ],
      }),
      true
    );

    // Create foreign key constraint to users table
    await queryRunner.createForeignKey(
      'user_auth_methods',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE', // When user is deleted, delete auth methods
      })
    );

    // Create indexes for better performance
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
        name: 'IDX_user_auth_methods_type',
        columnNames: ['auth_type'],
      })
    );

    await queryRunner.createIndex(
      'user_auth_methods',
      new TableIndex({
        name: 'IDX_user_auth_methods_provider_id',
        columnNames: ['auth_type', 'auth_provider_id'],
        isUnique: true, // 同一平台的一个用户只能绑定一次
      })
    );

    await queryRunner.createIndex(
      'user_auth_methods',
      new TableIndex({
        name: 'IDX_user_auth_methods_email',
        columnNames: ['email'],
      })
    );

    await queryRunner.createIndex(
      'user_auth_methods',
      new TableIndex({
        name: 'IDX_user_auth_methods_primary',
        columnNames: ['user_id', 'is_primary'],
      })
    );

    // Create partial index for active OAuth tokens
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY "IDX_user_auth_methods_active_oauth"
      ON "user_auth_methods" ("user_id", "auth_type")
      WHERE "auth_type" IN ('github', 'google', 'wechat', 'qq', 'apple')
      AND "expires_at" > NOW()
      AND "access_token" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('user_auth_methods', 'IDX_user_auth_methods_active_oauth');
    await queryRunner.dropIndex('user_auth_methods', 'IDX_user_auth_methods_primary');
    await queryRunner.dropIndex('user_auth_methods', 'IDX_user_auth_methods_email');
    await queryRunner.dropIndex('user_auth_methods', 'IDX_user_auth_methods_provider_id');
    await queryRunner.dropIndex('user_auth_methods', 'IDX_user_auth_methods_type');
    await queryRunner.dropIndex('user_auth_methods', 'IDX_user_auth_methods_user_id');

    // Drop foreign key
    const table = await queryRunner.getTable('user_auth_methods');
    if (table) {
      const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('user_id') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('user_auth_methods', foreignKey);
      }
    }

    // Drop table
    await queryRunner.dropTable('user_auth_methods');
  }
}