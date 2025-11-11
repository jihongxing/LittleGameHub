import { Sequelize } from 'sequelize'
import { logger } from '@/utils/logger'

// 从环境变量获取数据库配置
const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'gamehub',
  DB_USER = 'postgres',
  DB_PASSWORD = '',
  DB_DIALECT = 'postgres',
  NODE_ENV = 'development'
} = process.env

// 创建数据库连接
export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: parseInt(DB_PORT),
  dialect: DB_DIALECT as 'postgres' | 'mysql' | 'sqlite' | 'mariadb' | 'mssql',
  
  // 连接池配置
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  
  // 日志配置
  logging: NODE_ENV === 'development' ? (msg: string) => logger.debug(msg) : false,
  
  // 时区配置
  timezone: '+08:00',
  
  // 其他配置
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
})

// 测试数据库连接
export const connectDatabase = async () => {
  try {
    await sequelize.authenticate()
    logger.info('数据库连接成功')
  } catch (error) {
    logger.error('数据库连接失败:', error)
    throw error
  }
}

// 关闭数据库连接
export const closeDatabase = async () => {
  try {
    await sequelize.close()
    logger.info('数据库连接已关闭')
  } catch (error) {
    logger.error('关闭数据库连接时出错:', error)
    throw error
  }
}

// 同步数据库模型
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force })
    logger.info(`数据库模型${force ? '强制' : ''}同步完成`)
  } catch (error) {
    logger.error('数据库模型同步失败:', error)
    throw error
  }
}