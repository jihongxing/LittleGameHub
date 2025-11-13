/**
 * GitHub OAuth Provider
 * GitHub OAuth 提供商
 *
 * Implements OAuth 2.0 flow for GitHub authentication
 * 实现GitHub认证的OAuth 2.0流程
 */

import { OAuthProvider } from '../oauth-provider.abstract';
import { OAuthTokens, OAuthUser } from '../oauth-provider.interface';

/**
 * GitHub OAuth Provider Implementation
 * GitHub OAuth提供商实现
 */
export class GitHubOAuthProvider extends OAuthProvider {
  /**
   * 获取平台名称
   */
  get name(): string {
    return 'github';
  }

  /**
   * 获取GitHub授权URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.callbackUrl,
      scope: this.config.scope?.join(' ') || 'user:email',
      state: state,
    });

    return `https://github.com/login/oauth/authorize?${params}`;
  }

  /**
   * 交换授权码获取访问令牌
   */
  async exchangeCodeForToken(code: string): Promise<OAuthTokens> {
    const response = await this.makeRequest('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        redirect_uri: this.config.callbackUrl,
      }).toString(),
    });

    if (response.error) {
      throw new Error(`GitHub OAuth error: ${response.error_description || response.error}`);
    }

    return {
      accessToken: response.access_token,
      tokenType: response.token_type || 'Bearer',
      scope: response.scope,
    };
  }

  /**
   * 获取GitHub用户信息
   */
  async getUserInfo(accessToken: string): Promise<OAuthUser> {
    // 获取基本用户信息
    const userResponse = await this.makeRequest('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    // 获取用户邮箱信息
    let email: string | undefined;
    try {
      const emailsResponse = await this.makeRequest('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      // 找到主要邮箱
      const primaryEmail = emailsResponse.find((emailData: any) => emailData.primary);
      email = primaryEmail ? primaryEmail.email : emailsResponse[0]?.email;
    } catch (error) {
      // 如果无法获取邮箱信息，继续处理（有些用户可能设置了隐私）
      console.warn('Failed to fetch GitHub user emails:', error);
    }

    return this.createOAuthUser(
      userResponse.id.toString(),
      userResponse.name || userResponse.login,
      email,
      userResponse.avatar_url,
      userResponse
    );
  }

  /**
   * 验证GitHub访问令牌
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.makeRequest('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
