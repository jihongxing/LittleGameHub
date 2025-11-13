/**
 * OAuth Provider Abstract Base Class
 * OAuth 提供商抽象基类
 *
 * Provides common functionality for OAuth providers and enforces the interface contract
 * 为OAuth提供商提供通用功能并强制接口契约
 */

import { IOAuthProvider, OAuthConfig, OAuthTokens, OAuthUser } from './oauth-provider.interface';

/**
 * Abstract OAuth Provider
 * 抽象OAuth提供商
 */
export abstract class OAuthProvider implements IOAuthProvider {
  protected config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * 获取平台名称（必须由子类实现）
   */
  abstract get name(): string;

  /**
   * 生成授权URL
   */
  abstract getAuthorizationUrl(state: string): string;

  /**
   * 交换授权码获取访问令牌
   */
  abstract exchangeCodeForToken(code: string): Promise<OAuthTokens>;

  /**
   * 获取用户信息
   */
  abstract getUserInfo(accessToken: string): Promise<OAuthUser>;

  /**
   * 生成随机状态参数
   * 用于防止CSRF攻击
   */
  protected generateState(): string {
    // 在浏览器环境中，使用crypto API；在Node.js环境中，使用crypto模块
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // 浏览器环境
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Node.js环境
      const crypto = require('crypto');
      return crypto.randomBytes(32).toString('hex');
    }
  }

  /**
   * 验证状态参数
   * @param state 状态参数
   * @param storedState 存储的状态参数
   */
  protected validateState(state: string, storedState: string): boolean {
    return state === storedState;
  }

  /**
   * 标准化用户信息
   * 将不同平台的用户信息转换为统一的格式
   */
  protected createOAuthUser(
    providerId: string,
    name: string,
    email?: string,
    avatar?: string,
    rawData?: any
  ): OAuthUser {
    return {
      id: providerId,
      name: name,
      email: email,
      avatar: avatar,
      provider: this.name,
      rawData: rawData,
    };
  }

  /**
   * 验证配置
   */
  protected validateConfig(): void {
    if (!this.config.clientId) {
      throw new Error(`OAuth config for ${this.name}: clientId is required`);
    }
    if (!this.config.clientSecret) {
      throw new Error(`OAuth config for ${this.name}: clientSecret is required`);
    }
    if (!this.config.callbackUrl) {
      throw new Error(`OAuth config for ${this.name}: callbackUrl is required`);
    }
  }

  /**
   * HTTP请求工具方法
   */
  protected async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LittleGameHub-OAuth/1.0',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OAuth request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }
}
