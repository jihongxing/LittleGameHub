/**
 * 验证实体字段映射脚本
 * 检查所有 TypeORM 实体是否正确映射数据库字段
 */

import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';

interface FieldMapping {
  entityName: string;
  propertyName: string;
  columnName: string;
  hasExplicitMapping: boolean;
  isCorrect: boolean;
}

/**
 * 检查字段映射
 */
async function verifyFieldMappings() {
  console.log('🔍 开始验证实体字段映射...\n');

  try {
    const dataSource = new DataSource(databaseConfig);
    await dataSource.initialize();

    const mappings: FieldMapping[] = [];
    let totalFields = 0;
    let correctFields = 0;
    let incorrectFields = 0;

    // 遍历所有实体
    for (const metadata of dataSource.entityMetadatas) {
      console.log(`\n📋 实体: ${metadata.name} (表: ${metadata.tableName})`);

      // 检查所有列
      for (const column of metadata.columns) {
        totalFields++;
        
        const propertyName = column.propertyName;
        const columnName = column.databaseName;
        const expectedColumnName = toSnakeCase(propertyName);
        const isCorrect = columnName === expectedColumnName;
        const hasExplicitMapping = column.givenDatabaseName !== undefined;

        mappings.push({
          entityName: metadata.name,
          propertyName,
          columnName,
          hasExplicitMapping,
          isCorrect,
        });

        if (isCorrect) {
          correctFields++;
          console.log(`  ✅ ${propertyName} -> ${columnName}`);
        } else {
          incorrectFields++;
          console.log(`  ❌ ${propertyName} -> ${columnName} (期望: ${expectedColumnName})`);
          
          if (!hasExplicitMapping) {
            console.log(`     💡 建议: @Column({ name: '${expectedColumnName}' })`);
          }
        }
      }
    }

    await dataSource.destroy();

    // 打印总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 验证结果汇总');
    console.log('='.repeat(60));
    console.log(`总字段数: ${totalFields}`);
    console.log(`✅ 正确映射: ${correctFields} (${Math.round(correctFields / totalFields * 100)}%)`);
    console.log(`❌ 需要修复: ${incorrectFields} (${Math.round(incorrectFields / totalFields * 100)}%)`);

    // 输出需要修复的字段列表
    if (incorrectFields > 0) {
      console.log('\n🔧 需要修复的字段:');
      const incorrectMappings = mappings.filter(m => !m.isCorrect);
      
      for (const mapping of incorrectMappings) {
        const expectedName = toSnakeCase(mapping.propertyName);
        console.log(`\n${mapping.entityName}.${mapping.propertyName}`);
        console.log(`  当前: ${mapping.columnName}`);
        console.log(`  期望: ${expectedName}`);
        console.log(`  修复: @Column({ name: '${expectedName}' })`);
      }
    }

    process.exit(incorrectFields > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  }
}

/**
 * 转换为 snake_case
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/^_/, '');
}

// 运行验证
verifyFieldMappings();

