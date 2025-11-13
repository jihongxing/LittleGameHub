/**
 * TypeORM Data Source Configuration
 * 用于运行迁移的 TypeORM 数据源配置
 */

import 'reflect-metadata'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { DataSource } from 'typeorm'

// 加载环境变量（从项目根目录）
const envPath = path.resolve(__dirname, '../../../.env')
dotenv.config({ path: envPath })

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gamehub',
  synchronize: false,
  logging: false,
  entities: [
    path.join(__dirname, '../modules/**/entities/*.entity.ts'),
    path.join(__dirname, '../modules/**/entities/*.entity.js'),
  ],
  migrations: [
    path.join(__dirname, './migrations/*.ts'),
    path.join(__dirname, './migrations/*.js'),
  ],
  subscribers: [],
})
