/**
 * JWT Token 黑名单服务
 * 使用 Redis 存储已撤销的 Token
 */
import { getRedisClient } from '@/config/redis';
import { logger } from '@/utils/logger';
import jwt from 'jsonwebtoken';

/**
 * Token 黑名单服务类
 */
export class TokenBlacklistService {
  private readonly PREFIX = 'blacklist:token:';
  private readonly FALLBACK_SET = new Set<string>(); // Redis 故障时的内存备份

  /**
   * 将 Token 加入黑名单
   * @param token JWT Token
   * @param expiresIn Token 过期时间（秒）
   */
  async addToBlacklist(token: string, expiresIn?: number): Promise<void> {
    try {
      // 如果没有提供过期时间，从 token 中解析
      if (!expiresIn) {
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.exp) {
          const now = Math.floor(Date.now() / 1000);
          expiresIn = decoded.exp - now;
          
          // 如果 token 已过期，不需要加入黑名单
          if (expiresIn <= 0) {
            logger.info('Token already expired, skipping blacklist');
            return;
          }
        } else {
          // 默认保存 24 小时
          expiresIn = 24 * 60 * 60;
        }
      }

      const key = this.PREFIX + token;

      // 检查 Redis 是否可用
      try {
        const redisClient = getRedisClient();
        if (redisClient.isReady) {
          // 存储到 Redis，设置过期时间
          await redisClient.setEx(key, expiresIn, '1');
          logger.info(`Token added to blacklist (Redis), expires in ${expiresIn}s`);
          return;
        }
      } catch (redisError) {
        // Redis 不可用，使用内存备份
        this.FALLBACK_SET.add(token);
        logger.warn('Redis unavailable, using in-memory blacklist');
        
        // 设置定时器清除
        setTimeout(() => {
          this.FALLBACK_SET.delete(token);
        }, expiresIn * 1000);
      }
    } catch (error) {
      logger.error('Error adding token to blacklist:', error);
      // 降级到内存黑名单
      this.FALLBACK_SET.add(token);
    }
  }

  /**
   * 检查 Token 是否在黑名单中
   * @param token JWT Token
   * @returns 是否在黑名单中
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = this.PREFIX + token;

      // 优先检查 Redis
      try {
        const redisClient = getRedisClient();
        if (redisClient.isReady) {
          const exists = await redisClient.exists(key);
          return exists === 1;
        }
      } catch (redisError) {
        // Redis 不可用，检查内存备份
        logger.warn('Redis unavailable, checking in-memory blacklist');
        return this.FALLBACK_SET.has(token);
      }
      
      // Redis 未就绪，检查内存备份
      return this.FALLBACK_SET.has(token);
    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      // 出错时检查内存备份
      return this.FALLBACK_SET.has(token);
    }
  }

  /**
   * 从黑名单中移除 Token（通常不需要，因为会自动过期）
   * @param token JWT Token
   */
  async removeFromBlacklist(token: string): Promise<void> {
    try {
      const key = this.PREFIX + token;

      try {
        const redisClient = getRedisClient();
        if (redisClient.isReady) {
          await redisClient.del(key);
          logger.info('Token removed from blacklist (Redis)');
        }
      } catch (redisError) {
        logger.warn('Redis unavailable during token removal');
      }
      
      // 同时从内存备份中移除
      this.FALLBACK_SET.delete(token);
    } catch (error) {
      logger.error('Error removing token from blacklist:', error);
    }
  }

  /**
   * 清空黑名单（危险操作，仅用于测试）
   */
  async clearBlacklist(): Promise<void> {
    try {
      try {
        const redisClient = getRedisClient();
        if (redisClient.isReady) {
          const keys = await redisClient.keys(this.PREFIX + '*');
          if (keys.length > 0) {
            await redisClient.del(keys);
            logger.warn(`Cleared ${keys.length} tokens from blacklist (Redis)`);
          }
        }
      } catch (redisError) {
        logger.warn('Redis unavailable during blacklist clearing');
      }
      
      // 清空内存备份
      this.FALLBACK_SET.clear();
    } catch (error) {
      logger.error('Error clearing blacklist:', error);
    }
  }

  /**
   * 获取黑名单中的 Token 数量
   */
  async getBlacklistSize(): Promise<number> {
    try {
      try {
        const redisClient = getRedisClient();
        if (redisClient.isReady) {
          const keys = await redisClient.keys(this.PREFIX + '*');
          return keys.length;
        }
      } catch (redisError) {
        logger.warn('Redis unavailable, returning in-memory blacklist size');
      }
      
      return this.FALLBACK_SET.size;
    } catch (error) {
      logger.error('Error getting blacklist size:', error);
      return this.FALLBACK_SET.size;
    }
  }
}

// 导出单例
export const tokenBlacklistService = new TokenBlacklistService();

