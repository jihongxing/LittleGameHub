/**
 * CSRF 保护服务
 * CSRF Protection Service
 *
 * 生成和验证 CSRF Token，防止跨站请求伪造攻击
 * Generate and validate CSRF tokens to prevent cross-site request forgery attacks
 */
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { getRedisClient } from '@/config/redis';
import { logger } from '@/utils/logger';
import { ValidationError } from '@/middleware';

export interface CSRFConfig {
  cookieName: string;           // CSRF Cookie 名称
  headerName: string;           // CSRF 请求头名称
  tokenLength: number;          // Token 长度
  maxAge: number;              // Token 有效期（秒）
  secure: boolean;             // 是否只在 HTTPS 下传输
  sameSite: 'strict' | 'lax' | 'none'; // SameSite 属性
  domain?: string;             // Cookie 域
}

export interface CSRFToken {
  token: string;
  expiresAt: number;
  createdAt: number;
}

/**
 * 默认 CSRF 配置
 */
const DEFAULT_CSRF_CONFIG: CSRFConfig = {
  cookieName: 'XSRF-TOKEN',
  headerName: 'X-XSRF-TOKEN',
  tokenLength: 32,
  maxAge: 60 * 60, // 1小时
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

/**
 * CSRF 白名单（不需要 CSRF 保护的请求）
 */
const CSRF_WHITELIST = [
  // GET 请求通常不需要 CSRF 保护
  { method: 'GET', pattern: /.*/ },
  // OPTIONS 请求用于 CORS 预检
  { method: 'OPTIONS', pattern: /.*/ },
  // HEAD 请求
  { method: 'HEAD', pattern: /.*/ },
];

/**
 * CSRF 存储接口
 */
interface CSRFStore {
  storeToken(token: string, data: CSRFToken): Promise<void>;
  getToken(token: string): Promise<CSRFToken | null>;
  deleteToken(token: string): Promise<void>;
  cleanup(): Promise<void>;
}

/**
 * Redis CSRF 存储实现
 */
class RedisCSRFStore implements CSRFStore {
  private readonly PREFIX = 'csrf:token:';

  async storeToken(token: string, data: CSRFToken): Promise<void> {
    try {
      const redisClient = getRedisClient();
      if (!redisClient.isReady) {
        throw new Error('Redis client not ready');
      }

      const key = this.PREFIX + token;
      const ttl = Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000));

      await redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (error) {
      logger.error('Redis CSRF store error:', error);
      throw error;
    }
  }

  async getToken(token: string): Promise<CSRFToken | null> {
    try {
      const redisClient = getRedisClient();
      if (!redisClient.isReady) {
        return null;
      }

      const key = this.PREFIX + token;
      const data = await redisClient.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as CSRFToken;
    } catch (error) {
      logger.error('Redis CSRF get error:', error);
      return null;
    }
  }

  async deleteToken(token: string): Promise<void> {
    try {
      const redisClient = getRedisClient();
      if (redisClient.isReady) {
        const key = this.PREFIX + token;
        await redisClient.del(key);
      }
    } catch (error) {
      logger.error('Redis CSRF delete error:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const redisClient = getRedisClient();
      if (redisClient.isReady) {
        const pattern = this.PREFIX + '*';
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
    } catch (error) {
      logger.error('Redis CSRF cleanup error:', error);
    }
  }
}

/**
 * 内存 CSRF 存储实现（Redis 降级用）
 */
class MemoryCSRFStore implements CSRFStore {
  private store = new Map<string, CSRFToken>();

  async storeToken(token: string, data: CSRFToken): Promise<void> {
    this.store.set(token, data);

    // 设置自动过期
    const ttl = Math.max(0, data.expiresAt - Date.now());
    if (ttl > 0) {
      setTimeout(() => {
        this.store.delete(token);
      }, ttl);
    }
  }

  async getToken(token: string): Promise<CSRFToken | null> {
    const data = this.store.get(token);
    if (!data) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > data.expiresAt) {
      this.store.delete(token);
      return null;
    }

    return data;
  }

  async deleteToken(token: string): Promise<void> {
    this.store.delete(token);
  }

  async cleanup(): Promise<void> {
    this.store.clear();
  }
}

/**
 * CSRF 保护服务类
 */
export class CSRFService {
  private config: CSRFConfig;
  private store: CSRFStore;
  private fallbackStore: MemoryCSRFStore;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...DEFAULT_CSRF_CONFIG, ...config };
    this.fallbackStore = new MemoryCSRFStore();
    this.store = new RedisCSRFStore();
  }

  /**
   * 检查请求是否在 CSRF 白名单中
   */
  private isWhitelisted(req: Request): boolean {
    return CSRF_WHITELIST.some(({ method, pattern }) => {
      return req.method === method && pattern.test(req.path);
    });
  }

  /**
   * 生成 CSRF Token
   */
  generateToken(): string {
    return randomBytes(this.config.tokenLength).toString('hex');
  }

  /**
   * 为用户创建 CSRF Token
   */
  async createToken(userId?: string): Promise<string> {
    const token = this.generateToken();
    const now = Date.now();

    const tokenData: CSRFToken = {
      token,
      expiresAt: now + (this.config.maxAge * 1000),
      createdAt: now,
    };

    try {
      await this.store.storeToken(token, tokenData);
    } catch (error) {
      logger.error('CSRF token store failed, using fallback:', error);
      await this.fallbackStore.storeToken(token, tokenData);
    }

    return token;
  }

  /**
   * 验证 CSRF Token
   */
  async validateToken(token: string): Promise<boolean> {
    if (!token) {
      return false;
    }

    try {
      // 先尝试 Redis
      const tokenData = await this.store.getToken(token);
      if (tokenData) {
        return true;
      }
    } catch (error) {
      logger.error('CSRF token validation (Redis) failed:', error);
    }

    // 降级到内存存储
    try {
      const tokenData = await this.fallbackStore.getToken(token);
      return tokenData !== null;
    } catch (error) {
      logger.error('CSRF token validation (fallback) failed:', error);
      return false;
    }
  }

  /**
   * 从请求中提取 CSRF Token
   */
  extractToken(req: Request): string | null {
    // 优先从请求头中提取
    const headerToken = req.headers[this.config.headerName.toLowerCase()] as string;
    if (headerToken) {
      return headerToken;
    }

    // 从请求体中提取
    const bodyToken = req.body?.[this.config.cookieName] || req.body?.csrfToken;
    if (bodyToken) {
      return bodyToken;
    }

    // 从查询参数中提取（不推荐，仅用于兼容性）
    const queryToken = req.query[this.config.cookieName] as string;
    if (queryToken) {
      return queryToken;
    }

    return null;
  }

  /**
   * 在响应中设置 CSRF Token Cookie
   */
  setTokenCookie(res: Response, token: string): void {
    res.cookie(this.config.cookieName, token, {
      httpOnly: false, // 需要前端 JavaScript 访问
      secure: this.config.secure,
      sameSite: this.config.sameSite,
      domain: this.config.domain,
      maxAge: this.config.maxAge * 1000,
    });
  }

  /**
   * 在响应头中设置 CSRF Token
   */
  setTokenHeader(res: Response, token: string): void {
    res.setHeader(this.config.headerName, token);
  }

  /**
   * 清理用户的 CSRF Token（登出时调用）
   */
  async clearTokens(userId?: string): Promise<void> {
    // 注意：这里简化处理，实际可能需要根据用户ID清理所有相关Token
    // 由于Token是随机生成的，这里主要是为了清理过期Token
    try {
      await this.store.cleanup();
    } catch (error) {
      logger.error('CSRF cleanup failed:', error);
      await this.fallbackStore.cleanup();
    }
  }

  /**
   * CSRF 保护中间件
   */
  createMiddleware(options: {
    skipAuth?: boolean;  // 是否跳过认证检查
    whitelist?: Array<{ method: string; pattern: RegExp }>; // 自定义白名单
  } = {}) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // 检查是否在白名单中
        const customWhitelist = options.whitelist || [];
        const isWhitelisted = this.isWhitelisted(req) ||
          customWhitelist.some(({ method, pattern }) =>
            req.method === method && pattern.test(req.path)
          );

        if (isWhitelisted) {
          return next();
        }

        // 检查用户认证（可选）
        if (!options.skipAuth && !req.user) {
          throw new ValidationError('CSRF 保护需要用户认证');
        }

        // 提取并验证 CSRF Token
        const token = this.extractToken(req);
        if (!token) {
          throw new ValidationError('缺少 CSRF Token');
        }

        const isValid = await this.validateToken(token);
        if (!isValid) {
          logger.warn('Invalid CSRF token attempt', {
            token,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
          });
          throw new ValidationError('无效的 CSRF Token');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * CSRF Token 生成中间件（用于设置新Token）
   */
  createTokenMiddleware(options: { alwaysSet?: boolean } = {}) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // 如果用户已认证或总是设置Token，则生成新Token
        if (req.user || options.alwaysSet) {
          const token = await this.createToken(req.user?.id);
          this.setTokenCookie(res, token);
          this.setTokenHeader(res, token);

          // 将Token添加到响应中，方便前端使用
          res.locals.csrfToken = token;
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * 获取 CSRF 配置
   */
  getConfig(): CSRFConfig {
    return { ...this.config };
  }

  /**
   * 更新 CSRF 配置
   */
  updateConfig(config: Partial<CSRFConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// 导出单例
export const csrfService = new CSRFService();

