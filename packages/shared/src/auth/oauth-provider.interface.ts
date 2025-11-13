/**
 * OAuth Provider Interface
 * OAuth 提供商接口
 *
 * Defines the contract that all OAuth providers must implement
 * 定义所有OAuth提供商必须实现的契约
 */

export interface OAuthConfig {
  /** OAuth 应用客户端ID */
  clientId: string;
  /** OAuth 应用客户端密钥 */
  clientSecret: string;
  /** OAuth 回调URL */
  callbackUrl: string;
  /** 授权范围 */
  scope?: string[];
  /** 自定义参数 */
  [key: string]: any;
}

export interface OAuthUser {
  /** 第三方平台的用户ID */
  id: string;
  /** 用户邮箱 */
  email?: string;
  /** 用户昵称 */
  name: string;
  /** 用户头像URL */
  avatar?: string;
  /** 第三方平台名称 */
  provider: string;
  /** 原始用户信息 */
  rawData?: any;
}

export interface OAuthTokens {
  /** 访问令牌 */
  accessToken: string;
  /** 令牌类型 */
  tokenType?: string;
  /** 过期时间（秒） */
  expiresIn?: number;
  /** 刷新令牌 */
  refreshToken?: string;
  /** 授权范围 */
  scope?: string;
}

export interface IOAuthProvider {
  /**
   * 获取平台名称
   */
  get name(): string;

  /**
   * 生成授权URL
   * @param state 状态参数，用于防止CSRF攻击
   */
  getAuthorizationUrl(state: string): string;

  /**
   * 交换授权码获取访问令牌
   * @param code 授权码
   */
  exchangeCodeForToken(code: string): Promise<OAuthTokens>;

  /**
   * 获取用户信息
   * @param accessToken 访问令牌
   */
  getUserInfo(accessToken: string): Promise<OAuthUser>;

  /**
   * 验证访问令牌
   * @param accessToken 访问令牌
   */
  validateToken?(accessToken: string): Promise<boolean>;

  /**
   * 刷新访问令牌
   * @param refreshToken 刷新令牌
   */
  refreshToken?(refreshToken: string): Promise<OAuthTokens>;
}
