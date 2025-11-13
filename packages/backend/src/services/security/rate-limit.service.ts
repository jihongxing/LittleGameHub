/**
 * 增强的限流服务
 * Enhanced Rate Limiting Service
 *
 * 支持基于用户、IP、端点的多维度限流
 * Support multi-dimensional rate limiting (user, IP, endpoint based)
 */
import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '@/config/redis';
import { logger } from '@/utils/logger';
import { RateLimitError } from '@/middleware';

export interface RateLimitConfig {
  windowMs: number;        // 时间窗口（毫秒）
  max: number;            // 最大请求次数
  skipSuccessfulRequests?: boolean; // 跳过成功请求
  skipFailedRequests?: boolean;     // 跳过失败请求
  message?: string;       // 错误消息
  keyGenerator?: (req: Request) => string; // 键生成器
  handler?: (req: Request, res: Response) => void; // 自定义处理器
}

export interface RateLimitRule {
  name: string;           // 规则名称
  config: RateLimitConfig;
  enabled?: boolean;      // 是否启用
  priority?: number;      // 优先级
  description?: string;   // 描述
}

/**
 * 限流键类型
 */
export enum RateLimitKeyType {
  IP = 'ip',
  USER = 'user',
  USER_IP = 'user_ip',
  ENDPOINT = 'endpoint',
  GLOBAL = 'global',
}

/**
 * 限流存储接口
 */
interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ current: number; resetTime: number }>;
  reset(key: string): Promise<void>;
}

/**
 * Redis 限流存储实现
 */
class RedisRateLimitStore implements RateLimitStore {
  async increment(key: string, windowMs: number): Promise<{ current: number; resetTime: number }> {
    try {
      const redisClient = getRedisClient();
      if (!redisClient.isReady) {
        throw new Error('Redis client not ready');
      }

      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      const windowKey = `${key}:${windowStart}`;

      // 使用原子操作增加计数
      const count = await redisClient.incr(windowKey);
      await redisClient.pExpire(windowKey, windowMs);

      return {
        current: count,
        resetTime: windowStart + windowMs,
      };
    } catch (error) {
      logger.error('Redis rate limit increment error:', error);
      throw error;
    }
  }

  async reset(key: string): Promise<void> {
    try {
      const redisClient = getRedisClient();
      if (redisClient.isReady) {
        // 删除所有相关的窗口键
        const pattern = `${key}:*`;
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
    } catch (error) {
      logger.error('Redis rate limit reset error:', error);
    }
  }
}

/**
 * 内存限流存储实现（Redis 降级用）
 */
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string, windowMs: number): Promise<{ current: number; resetTime: number }> {
    const now = Date.now();
    const resetTime = Math.floor(now / windowMs) * windowMs + windowMs;

    const existing = this.store.get(key);
    if (!existing || now > existing.resetTime) {
      // 新的时间窗口
      this.store.set(key, { count: 1, resetTime });
      return { current: 1, resetTime };
    } else {
      // 增加现有窗口的计数
      existing.count++;
      this.store.set(key, existing);
      return { current: existing.count, resetTime: existing.resetTime };
    }
  }

  async reset(key: string): Promise<void> {
    const pattern = new RegExp(`^${key}:`);
    for (const [k] of this.store) {
      if (pattern.test(k)) {
        this.store.delete(k);
      }
    }
  }
}

/**
 * 增强的限流服务类
 */
export class RateLimitService {
  private store: RateLimitStore;
  private rules: Map<string, RateLimitRule> = new Map();
  private fallbackStore: MemoryRateLimitStore;

  constructor() {
    this.fallbackStore = new MemoryRateLimitStore();
    this.store = new RedisRateLimitStore();

    // 初始化默认规则
    this.initializeDefaultRules();
  }

  /**
   * 初始化默认限流规则
   */
  private initializeDefaultRules(): void {
    // 通用规则
    this.addRule('general', {
      config: {
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 100,
      },
      priority: 1,
      description: '通用API限流规则',
    });

    // 认证相关规则
    this.addRule('auth-strict', {
      config: {
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 10,
      },
      priority: 10,
      description: '认证操作严格限流',
    });

    // 登录规则
    this.addRule('login', {
      config: {
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 5,
        skipSuccessfulRequests: true,
      },
      priority: 10,
      description: '登录尝试限流',
    });

    // 注册规则
    this.addRule('register', {
      config: {
        windowMs: 60 * 60 * 1000, // 1小时
        max: 3,
      },
      priority: 10,
      description: '注册尝试限流',
    });

    // 文件下载规则
    this.addRule('download', {
      config: {
        windowMs: 60 * 60 * 1000, // 1小时
        max: 20,
      },
      priority: 5,
      description: '文件下载限流',
    });
  }

  /**
   * 添加限流规则
   */
  addRule(name: string, rule: Omit<RateLimitRule, 'name'>): void {
    this.rules.set(name, {
      name,
      enabled: true,
      priority: 1,
      ...rule
    });
  }

  /**
   * 获取限流规则
   */
  getRule(name: string): RateLimitRule | undefined {
    return this.rules.get(name);
  }

  /**
   * 更新限流规则
   */
  updateRule(name: string, updates: Partial<RateLimitRule>): void {
    const existing = this.rules.get(name);
    if (existing) {
      this.rules.set(name, { ...existing, ...updates });
    }
  }

  /**
   * 删除限流规则
   */
  removeRule(name: string): boolean {
    return this.rules.delete(name);
  }

  /**
   * 获取所有规则
   */
  getAllRules(): RateLimitRule[] {
    return Array.from(this.rules.values()).sort((a, b) => (b.priority || 1) - (a.priority || 1));
  }

  /**
   * 生成限流键
   */
  generateKey(type: RateLimitKeyType, req: Request, ruleName?: string): string {
    const prefix = `ratelimit:${ruleName || 'default'}`;
    const endpoint = `${req.method}:${req.baseUrl}${req.path}`;

    switch (type) {
      case RateLimitKeyType.IP:
        return `${prefix}:ip:${req.ip || 'unknown'}`;

      case RateLimitKeyType.USER:
        return `${prefix}:user:${req.user?.id || 'anonymous'}`;

      case RateLimitKeyType.USER_IP:
        return `${prefix}:userip:${req.user?.id || 'anonymous'}:${req.ip || 'unknown'}`;

      case RateLimitKeyType.ENDPOINT:
        return `${prefix}:endpoint:${endpoint}`;

      case RateLimitKeyType.GLOBAL:
        return `${prefix}:global`;

      default:
        return `${prefix}:ip:${req.ip || 'unknown'}`;
    }
  }

  /**
   * 检查限流
   */
  async checkLimit(
    req: Request,
    ruleName: string = 'general',
    keyType: RateLimitKeyType = RateLimitKeyType.IP
  ): Promise<{ allowed: boolean; current: number; resetTime: number; limit: number }> {
    const rule = this.rules.get(ruleName);
    if (!rule || !rule.enabled) {
      return { allowed: true, current: 0, resetTime: 0, limit: 0 };
    }

    const key = this.generateKey(keyType, req, ruleName);

    try {
      const result = await this.store.increment(key, rule.config.windowMs);
      const allowed = result.current <= rule.config.max;

      if (!allowed) {
        logger.warn(`Rate limit exceeded for ${ruleName}: ${key}`, {
          current: result.current,
          limit: rule.config.max,
          resetTime: result.resetTime,
        });
      }

      return {
        allowed,
        current: result.current,
        resetTime: result.resetTime,
        limit: rule.config.max,
      };
    } catch (error) {
      logger.error('Rate limit check failed, using fallback store:', error);

      // 使用内存存储作为降级方案
      try {
        const result = await this.fallbackStore.increment(key, rule.config.windowMs);
        const allowed = result.current <= rule.config.max;

        return {
          allowed,
          current: result.current,
          resetTime: result.resetTime,
          limit: rule.config.max,
        };
      } catch (fallbackError) {
        logger.error('Fallback rate limit check also failed:', fallbackError);
        // 如果降级也失败，允许请求通过
        return { allowed: true, current: 0, resetTime: 0, limit: 0 };
      }
    }
  }

  /**
   * 重置限流计数
   */
  async resetLimit(
    req: Request,
    ruleName: string = 'general',
    keyType: RateLimitKeyType = RateLimitKeyType.IP
  ): Promise<void> {
    const key = this.generateKey(keyType, req, ruleName);

    try {
      await this.store.reset(key);
      logger.info(`Rate limit reset for ${ruleName}: ${key}`);
    } catch (error) {
      logger.error('Rate limit reset failed:', error);
      // 降级重置
      await this.fallbackStore.reset(key);
    }
  }

  /**
   * 获取限流状态
   */
  async getLimitStatus(
    req: Request,
    ruleName: string = 'general',
    keyType: RateLimitKeyType = RateLimitKeyType.IP
  ): Promise<{ current: number; resetTime: number; limit: number } | null> {
    const rule = this.rules.get(ruleName);
    if (!rule || !rule.enabled) {
      return null;
    }

    // 这里可以实现获取当前状态的逻辑
    // 由于 Redis 的原子性，这里简化处理
    return {
      current: 0, // 需要从 Redis 获取实际计数
      resetTime: Date.now() + rule.config.windowMs,
      limit: rule.config.max,
    };
  }

  /**
   * 创建限流中间件
   */
  createMiddleware(
    ruleName: string = 'general',
    keyType: RateLimitKeyType = RateLimitKeyType.IP,
    options: { skipAuth?: boolean } = {}
  ) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await this.checkLimit(req, ruleName, keyType);

        // 设置响应头
        if (result.limit > 0) {
          res.set({
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': Math.max(0, result.limit - result.current).toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
          });
        }

        if (!result.allowed) {
          const rule = this.rules.get(ruleName);
          const message = rule?.config.message || '请求过于频繁，请稍后再试';

          throw new RateLimitError(message);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

// 导出单例
export const rateLimitService = new RateLimitService();

