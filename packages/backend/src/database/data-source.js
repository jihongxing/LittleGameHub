/**
 * TypeORM Data Source Configuration (JavaScript)
 * 用于运行迁移的 TypeORM 数据源配置
 */

require('reflect-metadata')
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })

const { DataSource } = require('typeorm')
const path = require('path')

const config = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '5625709', // 默认密码
  database: process.env.DB_NAME || 'gamehub',
  synchronize: false,
  logging: false,
  // 只加载已编译的 JavaScript 实体，避免 TypeScript 枚举解析错误
  entities: [
    path.join(__dirname, '../modules/**/entities/*.entity.js'),
  ],
  migrations: [
    path.join(__dirname, './migrations/*.js'),
  ],
  subscribers: [],
}

const AppDataSource = new DataSource(config)

module.exports = { AppDataSource }
