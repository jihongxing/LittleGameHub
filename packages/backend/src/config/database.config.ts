/**
 * Database Configuration and Connection Management
 * 数据库配置和连接管理
 * 
 * This module provides comprehensive database configuration for the GameHub
 * application using TypeORM with PostgreSQL. It handles connection setup,
 * entity discovery, migration management, and connection health monitoring.
 * 
 * 此模块为 GameHub 应用程序提供使用 TypeORM 和 PostgreSQL 的
 * 综合数据库配置。它处理连接设置、实体发现、迁移管理和连接健康监控。
 * 
 * Key features:
 * - PostgreSQL connection configuration
 * - Automatic entity discovery
 * - Migration management
 * - Connection pooling
 * - Health check functionality
 * - Environment-based configuration
 * 
 * 主要功能：
 * - PostgreSQL 连接配置
 * - 自动实体发现
 * - 迁移管理
 * - 连接池
 * - 健康检查功能
 * - 基于环境的配置
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 * @task T016
 */

import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { env } from './env';
import { SnakeCaseNamingStrategy } from './snake-case-naming.strategy';

/**
 * TypeORM database configuration
 */
export const databaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  
  // Entity discovery
  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
  
  // Migration configuration
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  
  // Logging
  logging: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  logger: 'advanced-console',
  
  // Connection pool
  poolSize: 10,
  
  // Naming strategy - 命名策略
  // Automatically converts camelCase to snake_case
  // 自动将 camelCase 转换为 snake_case
  namingStrategy: new SnakeCaseNamingStrategy(),
  
  // Synchronize schema (only in development)
  synchronize: env.NODE_ENV === 'development', // Automatically create tables in development
  
  // Drop schema on connection (NEVER in production)
  dropSchema: false,
  
  // Timezone - 时区设置通过extra配置
  // timezone: 'Z', // UTC - PostgreSQL不支持此选项
};

/**
 * TypeORM DataSource instance
 * Used for migrations and database operations
 */
export const AppDataSource = new DataSource(databaseConfig);

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<DataSource> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connection established successfully');
    }
    return AppDataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
}

/**
 * Get NestJS TypeORM configuration
 * 获取 NestJS TypeORM 配置
 * 
 * Returns configuration object compatible with NestJS TypeOrmModule.forRoot()
 * 返回与 NestJS TypeOrmModule.forRoot() 兼容的配置对象
 * 
 * @returns TypeORM module options for NestJS
 *          NestJS 的 TypeORM 模块选项
 */
export function getTypeOrmConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
    
    // Entity discovery - 实体发现
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    
    // Auto-load entities - 自动加载实体
    autoLoadEntities: true,
    
    // Synchronization (only in development) - 同步（仅在开发环境）
    synchronize: env.NODE_ENV === 'development',
    
    // Logging - 日志记录
    logging: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    
    // Connection pool - 连接池
    extra: {
      max: 10,
      min: 1,
      acquire: 30000,
      idle: 10000,
    },
    
    // Naming strategy - 命名策略
    namingStrategy: new SnakeCaseNamingStrategy(),
    
    // Timezone - 时区设置通过extra配置
    // timezone: 'Z', // UTC - PostgreSQL不支持此选项
  } as TypeOrmModuleOptions;
}

/**
 * Check database connection health
 * 检查数据库连接健康状况
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    if (!AppDataSource.isInitialized) {
      return false;
    }
    await AppDataSource.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

