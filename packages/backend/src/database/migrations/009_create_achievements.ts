/**
 * Create Achievements Tables Migration (User Story 8)
 * T206: Database migration for Achievement table
 */

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAchievements1234567890009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create achievements table
    await queryRunner.createTable(
      new Table({
        name: 'achievements',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'trigger_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'trigger_threshold',
            type: 'int',
          },
          {
            name: 'points_reward',
            type: 'int',
            default: 0,
          },
          {
            name: 'icon_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'rarity',
            type: 'enum',
            enum: ['common', 'rare', 'epic', 'legendary'],
            default: "'common'",
          },
          {
            name: 'is_hidden',
            type: 'boolean',
            default: false,
          },
          {
            name: 'display_order',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create user_achievements table
    await queryRunner.createTable(
      new Table({
        name: 'user_achievements',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
          },
          {
            name: 'achievement_id',
            type: 'int',
          },
          {
            name: 'unlocked_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'progress',
            type: 'int',
            default: 0,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'achievements',
      new TableIndex({
        name: 'IDX_achievements_category',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'achievements',
      new TableIndex({
        name: 'IDX_achievements_trigger_type',
        columnNames: ['trigger_type'],
      }),
    );

    await queryRunner.createIndex(
      'user_achievements',
      new TableIndex({
        name: 'IDX_user_achievements_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_achievements',
      new TableIndex({
        name: 'IDX_user_achievements_achievement_id',
        columnNames: ['achievement_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_achievements',
      new TableIndex({
        name: 'IDX_user_achievements_user_achievement',
        columnNames: ['user_id', 'achievement_id'],
        isUnique: true,
      }),
    );

    // Insert default achievements
    await queryRunner.query(`
      INSERT INTO achievements (title, description, category, trigger_type, trigger_threshold, points_reward, rarity, display_order) VALUES
      -- Gameplay Achievements
      ('初来乍到', '完成第一局游戏', 'gameplay', 'game_play_count', 1, 10, 'common', 1),
      ('游戏新手', '完成10局游戏', 'gameplay', 'game_play_count', 10, 50, 'common', 2),
      ('游戏老手', '完成50局游戏', 'gameplay', 'game_play_count', 50, 200, 'rare', 3),
      ('游戏大师', '完成100局游戏', 'gameplay', 'game_play_count', 100, 500, 'epic', 4),
      ('游戏传奇', '完成500局游戏', 'gameplay', 'game_play_count', 500, 2000, 'legendary', 5),
      
      -- Points Achievements
      ('积分新手', '累计获得100积分', 'points', 'points_earned', 100, 10, 'common', 10),
      ('积分达人', '累计获得1000积分', 'points', 'points_earned', 1000, 100, 'rare', 11),
      ('积分大亨', '累计获得10000积分', 'points', 'points_earned', 10000, 500, 'epic', 12),
      
      -- Social Achievements
      ('社交新人', '添加第一个好友', 'social', 'friends_count', 1, 10, 'common', 20),
      ('人气王', '拥有10个好友', 'social', 'friends_count', 10, 100, 'rare', 21),
      ('社交达人', '拥有50个好友', 'social', 'friends_count', 50, 500, 'epic', 22),
      
      -- Collection Achievements
      ('收藏家', '创建第一个收藏夹', 'collection', 'collections_count', 1, 10, 'common', 30),
      ('整理大师', '收藏夹中添加10个游戏', 'collection', 'games_in_collections', 10, 50, 'rare', 31),
      
      -- Membership Achievements
      ('会员支持者', '成为会员', 'membership', 'membership_tier', 1, 100, 'rare', 40),
      ('尊贵会员', '成为离线会员', 'membership', 'membership_tier', 2, 500, 'epic', 41),
      
      -- Streak Achievements
      ('坚持不懈', '连续登录7天', 'streak', 'login_streak', 7, 50, 'common', 50),
      ('恒心毅力', '连续登录30天', 'streak', 'login_streak', 30, 300, 'epic', 51),
      
      -- Special Achievements
      ('早起的鸟儿', '凌晨0-6点游玩游戏', 'special', 'early_bird_play', 1, 20, 'rare', 60),
      ('夜猫子', '凌晨2-5点游玩游戏', 'special', 'night_owl_play', 1, 20, 'rare', 61)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('user_achievements', 'IDX_user_achievements_user_achievement');
    await queryRunner.dropIndex('user_achievements', 'IDX_user_achievements_achievement_id');
    await queryRunner.dropIndex('user_achievements', 'IDX_user_achievements_user_id');
    await queryRunner.dropIndex('achievements', 'IDX_achievements_trigger_type');
    await queryRunner.dropIndex('achievements', 'IDX_achievements_category');

    // Drop tables
    await queryRunner.dropTable('user_achievements');
    await queryRunner.dropTable('achievements');
  }
}

