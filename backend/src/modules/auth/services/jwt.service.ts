/**
 * JWT Authentication Service JWT认证服务
 * Task: T022 任务：T022
 * 
 * Handles JWT token generation, validation, and refresh 处理JWT令牌生成、验证和刷新
 */

import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { env } from '../../../config/env';

/**
 * JWT payload interface JWT载荷接口
 * Structure of JWT token payload JWT令牌载荷的结构
 */
export interface JwtPayload {
  userId: string; // 用户ID / User ID
  email?: string; // 邮箱 / Email
  phone?: string; // 手机号 / Phone
  type: 'access' | 'refresh'; // 令牌类型：访问或刷新 / Token type: access or refresh
}

/**
 * Token pair interface 令牌对接口
 * Access and refresh token pair 访问和刷新令牌对
 */
export interface TokenPair {
  access_token: string; // 访问令牌 / Access token
  refresh_token: string; // 刷新令牌 / Refresh token
  expires_in: number; // 过期时间（秒）/ Expiration time in seconds
}

export class JwtService {
  /**
   * Generate access token 生成访问令牌
   * Creates a JWT access token for user authentication 创建用于用户认证的JWT访问令牌
   */
  static generateAccessToken(userId: string, email?: string, phone?: string): string {
    const payload: JwtPayload = {
      userId,
      email,
      phone,
      type: 'access',
    };

    const options: jwt.SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as any,
      issuer: 'gamehub-api',
      audience: 'gamehub-client',
    };
    return jwt.sign(payload, env.JWT_SECRET, options);
  }

  /**
   * Generate refresh token 生成刷新令牌
   * Creates a JWT refresh token for token renewal 创建用于令牌续期的JWT刷新令牌
   */
  static generateRefreshToken(userId: string): string {
    const payload: JwtPayload = {
      userId,
      type: 'refresh',
    };

    const options: jwt.SignOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
      issuer: 'gamehub-api',
      audience: 'gamehub-client',
    };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
  }

  /**
   * Generate both access and refresh tokens 生成访问和刷新令牌
   * Creates a complete token pair for user authentication 创建用于用户认证的完整令牌对
   */
  static generateTokenPair(userId: string, email?: string, phone?: string): TokenPair {
    const access_token = this.generateAccessToken(userId, email, phone);
    const refresh_token = this.generateRefreshToken(userId);

    // Parse expiration time 解析过期时间
    const expiresIn = this.parseExpiration(env.JWT_EXPIRES_IN);

    return {
      access_token,
      refresh_token,
      expires_in: expiresIn,
    };
  }

  /**
   * Verify access token 验证访问令牌
   * Validates JWT access token and extracts payload 验证JWT访问令牌并提取载荷
   */
  static verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'gamehub-api',
        audience: 'gamehub-client',
      }) as JwtPayload;

      if (payload.type !== 'access') {
        throw new Error('Invalid token type'); // 令牌类型无效 / Invalid token type
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired'); // 令牌已过期 / Token has expired
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token'); // 令牌无效 / Invalid token
      }
      throw error; // 抛出其他错误 / Throw other errors
    }
  }

  /**
   * Verify refresh token 验证刷新令牌
   * Validates JWT refresh token and extracts payload 验证JWT刷新令牌并提取载荷
   */
  static verifyRefreshToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: 'gamehub-api',
        audience: 'gamehub-client',
      }) as JwtPayload;

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification (for debugging) 解码令牌无需验证（用于调试）
   * Decodes JWT token without signature verification 无需签名验证即可解码JWT令牌
   */
  static decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Extract token from Authorization header 从授权头部提取令牌
   * Extracts JWT token from Bearer authorization header 从Bearer授权头部提取JWT令牌
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Parse expiration string (e.g., '1h', '7d') to seconds 解析过期时间字符串（如'1h'、'7d'）为秒数
   * Converts human-readable time format to seconds 将人类可读的时间格式转换为秒数
   */
  private static parseExpiration(expiresIn: string): number {
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
      w: 604800,
    };

    const match = expiresIn.match(/^(\d+)([smhdw])$/);
    if (!match) {
      return 3600; // Default 1 hour // 默认1小时 / Default 1 hour
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] as keyof typeof units;
    return value * units[unit];
  }

  /**
   * Check if token is expired 检查令牌是否过期
   * Determines if a JWT token has expired 判断JWT令牌是否已过期
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration date 获取令牌过期日期
   * Extracts expiration date from JWT token 从JWT令牌中提取过期日期
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return null;
      }
      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }
}
