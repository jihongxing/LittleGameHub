/**
 * Migration: Add Game Aggregation Fields
 * 为games表添加游戏聚合所需的字段
 * 
 * 新增字段：
 * - source: 游戏来源 (rawg, itch, igdb, wechat, douyin)
 * - source_id: 原始平台的游戏ID
 * - source_url: 原始游戏的直接链接
 * - genres: 游戏类型 (JSONB)
 * - platforms: 游戏平台 (JSONB)
 * - release_date: 发布日期
 * - rating: 游戏评分
 */

import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddGameAggregationFields1699900000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 添加 source 字段 - 游戏来源
    await queryRunner.addColumn(
      'games',
      new TableColumn({
        name: 'source',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: '游戏来源: rawg, itch, igdb, wechat, douyin',
      })
    );

    // 2. 添加 source_id 字段 - 原始平台的游戏ID
    await queryRunner.addColumn(
      'games',
      new TableColumn({
        name: 'source_id',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: '原始平台的游戏ID',
      })
    );

    // 3. 添加 source_url 字段 - 原始游戏的直接链接
    await queryRunner.addColumn(
      'games',
      new TableColumn({
        name: 'source_url',
        type: 'varchar',
        length: '500',
        isNullable: true,
        comment: '原始游戏的直接链接',
      })
    );

    // 4. 添加 genres 字段 - 游戏类型 (JSONB)
    await queryRunner.addColumn(
      'games',
      new TableColumn({
        name: 'genres',
        type: 'jsonb',
        default: "'[]'",
        isNullable: true,
        comment: '游戏类型数组',
      })
    );

    // 5. 添加 platforms 字段 - 游戏平台 (JSONB)
    await queryRunner.addColumn(
      'games',
      new TableColumn({
        name: 'platforms',
        type: 'jsonb',
        default: "'[]'",
        isNullable: true,
        comment: '游戏平台数组',
      })
    );

    // 6. 添加 release_date 字段 - 发布日期
    await queryRunner.addColumn(
      'games',
      new TableColumn({
        name: 'release_date',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: '游戏发布日期',
      })
    );

    // 7. 添加 rating 字段 - 游戏评分
    await queryRunner.addColumn(
      'games',
      new TableColumn({
        name: 'rating',
        type: 'decimal',
        precision: 5,
        scale: 2,
        isNullable: true,
        comment: '游戏评分',
      })
    );

    // 8. 创建索引以提高查询性能
    // 索引 source 和 source_id 用于去重检查
    await queryRunner.createIndex(
      'games',
      new TableIndex({
        name: 'IDX_games_source_source_id',
        columnNames: ['source', 'source_id'],
        isUnique: true,
      })
    );

    // 索引 source 用于按来源筛选
    await queryRunner.createIndex(
      'games',
      new TableIndex({
        name: 'IDX_games_source',
        columnNames: ['source'],
      })
    );

    // 索引 rating 用于按评分排序
    await queryRunner.createIndex(
      'games',
      new TableIndex({
        name: 'IDX_games_rating',
        columnNames: ['rating'],
      })
    );

    // 创建 GIN 索引用于 JSONB 字段查询
    await queryRunner.query(
      'CREATE INDEX "IDX_games_genres" ON "games" USING GIN ("genres")'
    );

    await queryRunner.query(
      'CREATE INDEX "IDX_games_platforms" ON "games" USING GIN ("platforms")'
    );

    console.log('✅ 游戏聚合字段添加成功');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.dropIndex('games', 'IDX_games_platforms');
    await queryRunner.dropIndex('games', 'IDX_games_genres');
    await queryRunner.dropIndex('games', 'IDX_games_rating');
    await queryRunner.dropIndex('games', 'IDX_games_source');
    await queryRunner.dropIndex('games', 'IDX_games_source_source_id');

    // 删除列
    await queryRunner.dropColumn('games', 'rating');
    await queryRunner.dropColumn('games', 'release_date');
    await queryRunner.dropColumn('games', 'platforms');
    await queryRunner.dropColumn('games', 'genres');
    await queryRunner.dropColumn('games', 'source_url');
    await queryRunner.dropColumn('games', 'source_id');
    await queryRunner.dropColumn('games', 'source');

    console.log('✅ 游戏聚合字段删除成功');
  }
}
