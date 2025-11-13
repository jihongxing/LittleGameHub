/**
 * Database Migration: Create Invitations Table
 * T123: Create database migration for Invitation table
 */

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateInvitations1700000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create invitations table
    await queryRunner.createTable(
      new Table({
        name: 'invitations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'inviter_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'invitee_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'invitation_code',
            type: 'varchar',
            length: '32',
            isUnique: true,
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
            name: 'invitation_link',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'points_awarded',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'reward_milestones',
            type: 'jsonb',
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'invitee_ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'device_fingerprint',
            type: 'varchar',
            length: '255',
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
      'invitations',
      new TableIndex({
        name: 'IDX_invitations_inviter_id',
        columnNames: ['inviter_id'],
      }),
    );

    await queryRunner.createIndex(
      'invitations',
      new TableIndex({
        name: 'IDX_invitations_invitee_id',
        columnNames: ['invitee_id'],
      }),
    );

    await queryRunner.createIndex(
      'invitations',
      new TableIndex({
        name: 'IDX_invitations_code',
        columnNames: ['invitation_code'],
      }),
    );

    await queryRunner.createIndex(
      'invitations',
      new TableIndex({
        name: 'IDX_invitations_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('invitations');
  }
}

