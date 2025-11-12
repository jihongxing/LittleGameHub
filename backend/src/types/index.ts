/**
 * GameHub Core Type Definitions
 * GameHub 核心类型定义
 * 
 * This file contains all core type definitions used throughout the GameHub
 * backend application. It provides type safety and consistency across modules.
 * 
 * 此文件包含整个 GameHub 后端应用程序中使用的所有核心类型定义。
 * 它为各个模块提供类型安全和一致性。
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Request } from 'express'

/**
 * User Role Enumeration
 * 用户角色枚举
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  DEVELOPER = 'developer'
}

/**
 * User Status Enumeration
 * 用户状态枚举
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

/**
 * Membership Status Enumeration
 * 会员状态枚举
 */
export enum MembershipStatus {
  FREE = 'free',
  PREMIUM = 'premium',
  VIP = 'vip'
}

/**
 * Game Category Enumeration
 * 游戏分类枚举
 */
export enum GameCategory {
  ACTION = 'action',
  ADVENTURE = 'adventure',
  RPG = 'rpg',
  STRATEGY = 'strategy',
  SIMULATION = 'simulation',
  SPORTS = 'sports',
  RACING = 'racing',
  PUZZLE = 'puzzle',
  ARCADE = 'arcade',
  CASUAL = 'casual'
}

/**
 * User Interface
 * 用户接口
 */
export interface User {
  id: string
  username: string
  email: string
  password?: string
  avatar?: string
  role: UserRole
  status: UserStatus
  membershipStatus: MembershipStatus
  isActive: boolean
  isEmailVerified: boolean
  emailVerificationToken?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * User Creation Attributes
 * 用户创建属性
 */
export interface UserCreationAttributes {
  username: string
  email: string
  password: string
  role?: UserRole
  emailVerificationToken?: string
}

/**
 * Game Interface
 * 游戏接口
 */
export interface Game {
  id: string
  title: string
  description: string
  category: GameCategory
  tags: string[]
  coverImage?: string
  screenshots: string[]
  downloadUrl?: string
  fileSize?: number
  version: string
  developer: string
  publisher?: string
  releaseDate: Date
  rating: number
  downloadCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * JWT Payload Interface
 * JWT 载荷接口
 */
export interface JwtPayload {
  id: string
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

/**
 * API Response Interface
 * API 响应接口
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  message: string
  data?: T
  errors?: string[]
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

/**
 * Pagination Interface
 * 分页接口
 */
export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Search Filters Interface
 * 搜索过滤器接口
 */
export interface SearchFilters {
  query?: string
  category?: GameCategory
  tags?: string[]
  minRating?: number
  maxRating?: number
  dateFrom?: Date
  dateTo?: Date
}

/**
 * Extended Request Interface with User
 * 带用户信息的扩展请求接口
 */
export interface AuthenticatedRequest extends Request {
  user?: any  // 使用any类型避免与Sequelize模型冲突
}

/**
 * File Upload Interface
 * 文件上传接口
 */
export interface FileUpload {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
}

/**
 * Email Options Interface
 * 邮件选项接口
 */
export interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
  attachments?: Array<{
    filename: string
    path: string
  }>
}

/**
 * Database Connection Options
 * 数据库连接选项
 */
export interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl?: boolean
  logging?: boolean
}

/**
 * Redis Connection Options
 * Redis 连接选项
 */
export interface RedisConfig {
  host: string
  port: number
  password?: string
  db: number
}

/**
 * Application Configuration Interface
 * 应用程序配置接口
 */
export interface AppConfig {
  port: number
  nodeEnv: 'development' | 'production' | 'test'
  apiPrefix: string
  corsOrigin: string
  jwtSecret: string
  jwtExpiresIn: string
  jwtRefreshSecret: string
  jwtRefreshExpiresIn: string
  database: DatabaseConfig
  redis: RedisConfig
  email: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
    from: string
  }
  upload: {
    maxFileSize: number
    allowedTypes: string[]
    destination: string
  }
}

/**
 * Error Response Interface
 * 错误响应接口
 */
export interface ErrorResponse {
  statusCode: number
  message: string
  error: string
  timestamp: string
  path: string
  details?: any
}

/**
 * Validation Error Interface
 * 验证错误接口
 */
export interface ValidationError {
  field: string
  message: string
  value?: any
}

/**
 * Health Check Response Interface
 * 健康检查响应接口
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error'
  timestamp: string
  uptime: number
  services: {
    database: 'connected' | 'disconnected'
    redis: 'connected' | 'disconnected'
    email: 'available' | 'unavailable'
  }
}
