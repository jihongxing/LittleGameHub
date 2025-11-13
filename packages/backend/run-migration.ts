/**
 * 数据库迁移执行脚本
 * Database Migration Runner Script
 * 
 * 用途：直接运行迁移脚本，无需使用 npm 命令
 * Purpose: Run migration directly without using npm commands
 * 
 * 使用方法：
 * ts-node run-migration.ts
 */

import 'reflect-metadata'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { DataSource } from 'typeorm'

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') })

console.log('🔄 正在初始化数据库连接...')
console.log('📍 数据库主机:', process.env.DB_HOST || 'localhost')
console.log('📍 数据库名称:', process.env.DB_NAME || 'gamehub')

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gamehub',
  synchronize: false,
  logging: true,
  entities: [
    path.join(__dirname, './src/modules/**/entities/*.entity.ts'),
    path.join(__dirname, './src/modules/**/entities/*.entity.js'),
  ],
  migrations: [
    path.join(__dirname, './src/database/migrations/*.ts'),
    path.join(__dirname, './src/database/migrations/*.js'),
  ],
})

async function runMigrations() {
  try {
    console.log('✅ 正在连接数据库...')
    await AppDataSource.initialize()
    console.log('✅ 数据库连接成功')

    console.log('✅ 正在运行迁移...')
    await AppDataSource.runMigrations()
    console.log('✅ 迁移运行成功')

    console.log('✅ 正在显示迁移历史...')
    const migrations = await AppDataSource.query(
      `SELECT * FROM "typeorm_metadata" WHERE "type" = 'migration' ORDER BY "timestamp" DESC`
    )
    console.log('📊 迁移历史:')
    migrations.forEach((m: any, i: number) => {
      console.log(`  ${i + 1}. ${m.name} (${new Date(m.timestamp).toLocaleString()})`)
    })

    console.log('✨ 迁移完成！')
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    process.exit(1)
  } finally {
    await AppDataSource.destroy()
  }
}

runMigrations()
