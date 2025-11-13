/**
 * GameHub Application Root Service
 * GameHub 应用程序根服务
 * 
 * This service provides business logic for root-level application operations.
 * It handles basic application information and health check functionality.
 * 
 * 此服务为根级应用程序操作提供业务逻辑。
 * 它处理基本的应用程序信息和健康检查功能。
 * 
 * Key responsibilities:
 * - Provide application welcome messages
 * - Handle health check operations
 * - Return application status information
 * 
 * 主要职责：
 * - 提供应用程序欢迎消息
 * - 处理健康检查操作
 * - 返回应用程序状态信息
 * 
 * @author GameHub Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getRedisClient } from './config/redis';

/**
 * Root Application Service
 * 根应用程序服务
 * 
 * Injectable service that provides core application functionality.
 * This service is available throughout the application via dependency injection.
 * 
 * 可注入的服务，提供核心应用程序功能。
 * 此服务通过依赖注入在整个应用程序中可用。
 */
@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource
  ) {}
  /**
   * Get application welcome message
   * 获取应用程序欢迎消息
   * 
   * Returns a standard welcome message that identifies the application
   * and its underlying framework. Used by the root endpoint.
   * 
   * 返回标识应用程序及其底层框架的标准欢迎消息。
   * 由根端点使用。
   * 
   * @returns {string} Application welcome message
   *                   应用程序欢迎消息
   * 
   * @example
   * const message = appService.getHello();
   * // Returns: "GameHub API - NestJS Application"
   */
  async getHello(): Promise<any> {
    const startTime = new Date();
    const uptime = process.uptime();
    
    // 检查各个服务状态
    const services = await this.checkServicesStatus();
    
    return {
      title: '🎮 GameHub API Server',
      version: '1.0.0',
      framework: 'NestJS',
      environment: process.env.NODE_ENV || 'development',
      startTime: startTime.toISOString(),
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      status: 'running',
      services,
      endpoints: {
        api: '/api',
        health: '/api/health',
        docs: '/api/docs (coming soon)'
      },
      message: '✅ All systems operational'
    };
  }

  /**
   * Get application health status
   * 获取应用程序健康状态
   * 
   * Returns the current health status of the application along with
   * a timestamp. This is used for monitoring and load balancing purposes.
   * 
   * 返回应用程序的当前健康状态以及时间戳。
   * 这用于监控和负载均衡目的。
   * 
   * The health check includes:
   * - Status: Always returns 'ok' if the service is running
   * - Timestamp: Current ISO timestamp when the check was performed
   * 
   * 健康检查包括：
   * - 状态：如果服务正在运行，始终返回 'ok'
   * - 时间戳：执行检查时的当前 ISO 时间戳
   * 
   * @returns {object} Health status object
   *                   健康状态对象
   * @returns {string} returns.status - Health status ('ok')
   *                                   健康状态 ('ok')
   * @returns {string} returns.timestamp - ISO timestamp
   *                                       ISO 时间戳
   * 
   * @example
   * const health = appService.getHealth();
   * // Returns: {
   * //   status: 'ok',
   * //   timestamp: '2024-01-01T12:00:00.000Z'
   * // }
   */
  async getHealth(): Promise<{ status: string; timestamp: string; services: any }> {
    const services = await this.checkServicesStatus();
    const allHealthy = Object.values(services).every(service => (service as any).status === 'connected');
    
    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services
    };
  }

  /**
   * 检查各个服务的状态
   * Check status of all services
   */
  private async checkServicesStatus() {
    const services = {
      database: await this.checkDatabaseStatus(),
      redis: await this.checkRedisStatus(),
      modules: this.getModulesStatus()
    };

    return services;
  }

  /**
   * 检查数据库连接状态
   * Check database connection status
   */
  private async checkDatabaseStatus() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'connected',
        type: 'PostgreSQL',
        message: '数据库连接正常'
      };
    } catch (error) {
      return {
        status: 'disconnected',
        type: 'PostgreSQL',
        message: '数据库连接失败',
        error: (error as Error).message
      };
    }
  }

  /**
   * 检查Redis连接状态
   * Check Redis connection status
   */
  private async checkRedisStatus() {
    try {
      const redis = getRedisClient();
      await redis.ping();
      return {
        status: 'connected',
        type: 'Redis',
        message: 'Redis连接正常'
      };
    } catch (error) {
      return {
        status: 'disconnected',
        type: 'Redis',
        message: 'Redis连接失败',
        error: (error as Error).message
      };
    }
  }

  /**
   * 获取模块状态
   * Get modules status
   */
  private getModulesStatus() {
    const modules = [
      'AuthModule', 'GamesModule', 'PointsModule', 'OfflineModule',
      'AchievementsModule', 'AuditModule', 'FileUploadModule',
      'RewardsModule', 'MembershipModule', 'InvitationsModule',
      'RecommendationsModule', 'CollectionsModule', 'SocialModule'
    ];

    return {
      status: 'loaded',
      count: modules.length,
      modules: modules,
      message: `${modules.length}个模块已加载`
    };
  }
}

