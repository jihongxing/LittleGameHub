/**
 * OAuth Service
 * OAuth 服务
 *
 * Handles OAuth authentication flow with various providers
 * 处理各种提供商的OAuth认证流程
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserAuthMethodRepository } from '../repositories/user-auth-method.repository';
import { UserAuthMethod, AuthType } from '../entities/user-auth-method.entity';
import { getUserRepository } from '@/services/repository.service';
import { User } from '@/modules/users/entities/user.entity';
import { OAuthService as SharedOAuthService, OAuthServiceConfig } from '@littlegamehub/shared';
import { GitHubOAuthProvider } from '@littlegamehub/shared';
import { OAuthError, OAuthErrorType } from '@littlegamehub/shared';

@Injectable()
export class OAuthBackendService {
  private readonly logger = new Logger(OAuthBackendService.name);
  private oauthService: InstanceType<typeof SharedOAuthService>;

  constructor(
    private configService: ConfigService,
    private userAuthMethodRepository: UserAuthMethodRepository,
  ) {
    this.initializeOAuthService();
  }

  /**
   * 初始化OAuth服务
   */
  private initializeOAuthService() {
    const config: OAuthServiceConfig = {
      defaultRedirectUri: this.configService.get<string>('OAUTH_REDIRECT_URI', 'http://localhost:8000/api/auth/oauth/callback'),
      providers: {
        github: new GitHubOAuthProvider({
          clientId: this.configService.get<string>('GITHUB_CLIENT_ID', ''),
          clientSecret: this.configService.get<string>('GITHUB_CLIENT_SECRET', ''),
          callbackUrl: `${this.configService.get<string>('OAUTH_REDIRECT_URI', 'http://localhost:8000/api/auth/oauth/callback')}/github`,
          scope: ['user:email'],
        }),
      },
    };

    this.oauthService = new SharedOAuthService(config);
  }

  /**
   * 获取OAuth授权URL
   */
  async getAuthorizationUrl(provider: string): Promise<{ url: string; state: string }> {
    try {
      const result = this.oauthService.getAuthorizationUrl(provider as any);
      return { url: result.url, state: result.state };
    } catch (error) {
      this.logger.error(`Failed to get authorization URL for provider ${provider}:`, error);
      throw error;
    }
  }

  /**
   * 处理OAuth回调并创建/更新用户
   */
  async handleOAuthCallback(
    provider: string,
    code: string,
    state: string,
  ): Promise<{ user: User; authMethod: UserAuthMethod; isNewUser: boolean }> {
    try {
      // 验证OAuth回调
      const oauthUser = await this.oauthService.handleCallback(
        provider as any,
        code,
        state
      );

      // 查找是否已存在该OAuth账户
      const existingAuthMethod = await this.userAuthMethodRepository.findByProviderId(
        oauthUser.id,
        provider as AuthType
      );

      let user: User;
      let authMethod: UserAuthMethod;
      let isNewUser = false;

      if (existingAuthMethod) {
        // 用户已存在，更新认证方法信息
        user = existingAuthMethod.user;
        authMethod = await this.updateAuthMethod(existingAuthMethod, oauthUser);
      } else {
        // 新用户，创建用户账户和认证方法
        const result = await this.createNewOAuthUser(oauthUser, provider as AuthType);
        user = result.user;
        authMethod = result.authMethod;
        isNewUser = true;
      }

      return { user, authMethod, isNewUser };

    } catch (error) {
      this.logger.error(`OAuth callback failed for provider ${provider}:`, error);
      throw error;
    }
  }

  /**
   * 创建新的OAuth用户
   */
  private async createNewOAuthUser(
    oauthUser: any,
    provider: AuthType
  ): Promise<{ user: User; authMethod: UserAuthMethod }> {
    const userRepository = getUserRepository();

    // 生成唯一的用户名
    let nickname = oauthUser.name || oauthUser.nickname;
    if (!nickname) {
      nickname = `${provider}_${oauthUser.id}`;
    }

    // 检查用户名是否已存在
    const existingUser = await userRepository.findOne({ where: { nickname } });
    if (existingUser) {
      nickname = `${nickname}_${Date.now()}`;
    }

    // 创建新用户
    const user = userRepository.create({
      nickname,
      email: oauthUser.email,
      avatar: oauthUser.avatar,
    });

    const savedUser = await userRepository.save(user);

    // 创建认证方法
    const authMethod = this.userAuthMethodRepository.repository.create({
      user_id: savedUser.id,
      auth_type: provider,
      auth_provider_id: oauthUser.id,
      email: oauthUser.email,
      display_name: oauthUser.name || oauthUser.nickname,
      avatar_url: oauthUser.avatar,
      provider_data: oauthUser.rawData,
      is_primary: true, // OAuth用户的主登录方式
    });

    const savedAuthMethod = await this.userAuthMethodRepository.repository.save(authMethod);
    savedAuthMethod.user = savedUser;

    return { user: savedUser, authMethod: savedAuthMethod };
  }

  /**
   * 更新现有的认证方法
   */
  private async updateAuthMethod(
    authMethod: UserAuthMethod,
    oauthUser: any
  ): Promise<UserAuthMethod> {
    authMethod.email = oauthUser.email;
    authMethod.display_name = oauthUser.name || oauthUser.nickname;
    authMethod.avatar_url = oauthUser.avatar;
    authMethod.provider_data = oauthUser.rawData;
    authMethod.last_login_at = new Date();

    // 如果这是用户第一次使用此OAuth方式登录，更新用户的基本信息
    if (authMethod.user) {
      if (oauthUser.email && !authMethod.user.email) {
        authMethod.user.email = oauthUser.email;
      }
      if (oauthUser.avatar && !authMethod.user.avatar) {
        authMethod.user.avatar = oauthUser.avatar;
      }
      await getUserRepository().save(authMethod.user);
    }

    return await this.userAuthMethodRepository.repository.save(authMethod);
  }

  /**
   * 断开OAuth连接
   */
  async disconnectOAuth(userId: string, provider: string): Promise<void> {
    const authMethod = await this.userAuthMethodRepository.findByUserIdAndType(
      userId,
      provider as AuthType
    );

    if (!authMethod) {
      throw new OAuthError(OAuthErrorType.INVALID_REQUEST, 'OAuth connection not found', provider);
    }

    // 检查是否是唯一登录方式
    const userAuthMethods = await this.userAuthMethodRepository.findByUserId(userId);
    if (userAuthMethods.length <= 1) {
      throw new OAuthError(
        OAuthErrorType.INVALID_REQUEST,
        'Cannot disconnect the only authentication method',
        provider
      );
    }

    // 清除OAuth令牌信息
    authMethod.clearOAuthTokens();
    authMethod.is_primary = false;

    await this.userAuthMethodRepository.repository.save(authMethod);
  }

  /**
   * 获取用户的OAuth连接状态
   */
  async getOAuthConnections(userId: string): Promise<UserAuthMethod[]> {
    return await this.userAuthMethodRepository.findByUserId(userId);
  }

  /**
   * 设置主登录方式
   */
  async setPrimaryAuthMethod(userId: string, provider: string): Promise<void> {
    await this.userAuthMethodRepository.setAsPrimary(
      `${userId}_${provider}`, // 需要根据实际情况调整
      userId
    );
  }
}
