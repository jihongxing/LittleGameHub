/**
 * Environment Configuration and Validation
 * 环境配置和验证
 * 
 * This module centralizes all environment variable access with type safety
 * and validation. It provides a single source of truth for all configuration
 * values used throughout the GameHub application.
 * 
 * 此模块集中管理所有环境变量访问，具有类型安全和验证功能。
 * 它为整个 GameHub 应用程序中使用的所有配置值提供单一数据源。
 * 
 * Key features:
 * - Type-safe environment variable access
 * - Default value handling
 * - Validation and error reporting
 * - Centralized configuration management
 * 
 * 主要功能：
 * - 类型安全的环境变量访问
 * - 默认值处理
 * - 验证和错误报告
 * - 集中配置管理
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// NOTE: .env is loaded in app.ts before this module is imported //已经从express迁移到nextjs，app.ts文件已经删除
// Do not load .env here to avoid duplicate loading and import order issues

/**
 * Environment configuration interface
 */
export interface EnvConfig {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  API_PREFIX: string;

  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_SSL: boolean;

  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // CORS
  CORS_ORIGIN: string;

  // File Upload
  MAX_FILE_SIZE: number;
  UPLOAD_DIR: string;

  // Email
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;

  // External Services
  CDN_URL?: string;
  OBJECT_STORAGE_BUCKET?: string;
}

/**
 * Get environment variable with type conversion
 */
function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] !== undefined ? process.env[key] : defaultValue;
  if (value === undefined) {
    console.error(`❌ Environment variable ${key} is required but not set`);
    console.error(`   Available keys: ${Object.keys(process.env).filter(k => k.startsWith('DB_')).join(', ')}`);
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  // 调试：打印密码相关的环境变量
  if (key === 'DB_PASSWORD') {
    console.log(`✅ DB_PASSWORD loaded: ${value ? '***' : '(empty)'}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return num;
}

function getEnvBoolean(key: string, defaultValue?: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value.toLowerCase() === 'true';
}

/**
 * Validated environment configuration
 */
export const env: EnvConfig = {
  // Server
  NODE_ENV: (getEnv('NODE_ENV', 'development') as EnvConfig['NODE_ENV']) || 'development',
  PORT: getEnvNumber('PORT', 8000),
  API_PREFIX: getEnv('API_PREFIX', '/api'),

  // Database
  DB_HOST: getEnv('DB_HOST', 'localhost'),
  DB_PORT: getEnvNumber('DB_PORT', 5432),
  DB_NAME: getEnv('DB_NAME', 'gamehub'),
  DB_USER: getEnv('DB_USER', 'postgres'),
  DB_PASSWORD: getEnv('DB_PASSWORD', ''),
  DB_SSL: getEnvBoolean('DB_SSL', false),

  // Redis
  REDIS_HOST: getEnv('REDIS_HOST', 'localhost'),
  REDIS_PORT: getEnvNumber('REDIS_PORT', 6379),
  REDIS_PASSWORD: getEnv('REDIS_PASSWORD', '123456'),
  REDIS_DB: getEnvNumber('REDIS_DB', 0),

  // JWT
  JWT_SECRET: getEnv('JWT_SECRET', 'dev-secret-key-change-in-production'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '1h'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-key-change-in-production'),
  JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),

  // CORS
  CORS_ORIGIN: getEnv('CORS_ORIGIN', 'http://localhost:3000'),

  // File Upload
  MAX_FILE_SIZE: getEnvNumber('MAX_FILE_SIZE', 10485760), // 10MB
  UPLOAD_DIR: getEnv('UPLOAD_DIR', './uploads'),

  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  // External Services
  CDN_URL: process.env.CDN_URL,
  OBJECT_STORAGE_BUCKET: process.env.OBJECT_STORAGE_BUCKET,
};

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Only enforce strict validation in production
  if (isProduction) {
    const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_PASSWORD'];
    const missing: string[] = [];

    for (const key of required) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables in production: ${missing.join(', ')}\n` +
          'Please check your .env file.'
      );
    }
  } else {
    // In development, just warn if JWT secrets are using defaults
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.warn('⚠️  WARNING: Using default JWT secrets in development. Set JWT_SECRET and JWT_REFRESH_SECRET in .env for production.');
    }
  }
}

// Validate on import (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}

