/**
 * UserAuthMethod Repository
 * 用户认证方法仓库
 *
 * Provides data access methods for UserAuthMethod entities
 * 为UserAuthMethod实体提供数据访问方法
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAuthMethod, AuthType } from '../entities/user-auth-method.entity';

@Injectable()
export class UserAuthMethodRepository {
  constructor(
    @InjectRepository(UserAuthMethod)
    public repository: Repository<UserAuthMethod>
  ) {}

  /**
   * Find auth methods by user ID
   */
  async findByUserId(userId: string): Promise<UserAuthMethod[]> {
    return this.repository.find({
      where: { user_id: userId },
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Find auth method by user ID and auth type
   */
  async findByUserIdAndType(userId: string, authType: AuthType): Promise<UserAuthMethod | null> {
    return this.repository.findOne({
      where: { user_id: userId, auth_type: authType },
    });
  }

  /**
   * Find auth method by provider ID and type
   */
  async findByProviderId(providerId: string, authType: AuthType): Promise<UserAuthMethod | null> {
    return this.repository.findOne({
      where: { auth_provider_id: providerId, auth_type: authType },
    });
  }

  /**
   * Find primary auth method for user
   */
  async findPrimaryByUserId(userId: string): Promise<UserAuthMethod | null> {
    return this.repository.findOne({
      where: { user_id: userId, is_primary: true },
    });
  }

  /**
   * Check if provider ID exists for auth type
   */
  async existsByProviderId(providerId: string, authType: AuthType): Promise<boolean> {
    const count = await this.repository.count({
      where: { auth_provider_id: providerId, auth_type: authType },
    });
    return count > 0;
  }

  /**
   * Unset primary flag for all auth methods of a user
   */
  async unsetPrimaryForUser(userId: string): Promise<void> {
    await this.repository.update(
      { user_id: userId, is_primary: true },
      { is_primary: false }
    );
  }

  /**
   * Set auth method as primary for user
   */
  async setAsPrimary(id: string, userId: string): Promise<void> {
    // First unset all primary flags for this user
    await this.unsetPrimaryForUser(userId);

    // Then set this one as primary
    await this.repository.update({ id }, { is_primary: true });
  }

  /**
   * Find OAuth auth methods with expired tokens
   */
  async findExpiredOAuthTokens(): Promise<UserAuthMethod[]> {
    return this.repository.createQueryBuilder('auth')
      .where('auth.auth_type IN (:...oauthTypes)', {
        oauthTypes: [AuthType.GITHUB, AuthType.GOOGLE, AuthType.WECHAT, AuthType.QQ, AuthType.APPLE],
      })
      .andWhere('auth.expires_at IS NOT NULL')
      .andWhere('auth.expires_at < NOW()')
      .getMany();
  }

  /**
   * Find OAuth auth methods with valid tokens
   */
  async findValidOAuthTokens(userId: string): Promise<UserAuthMethod[]> {
    return this.repository.createQueryBuilder('auth')
      .where('auth.user_id = :userId', { userId })
      .andWhere('auth.auth_type IN (:...oauthTypes)', {
        oauthTypes: [AuthType.GITHUB, AuthType.GOOGLE, AuthType.WECHAT, AuthType.QQ, AuthType.APPLE],
      })
      .andWhere('(auth.expires_at IS NULL OR auth.expires_at > NOW())')
      .andWhere('auth.access_token IS NOT NULL')
      .getMany();
  }

  /**
   * Count auth methods by type for a user
   */
  async countByUserIdAndType(userId: string, authType: AuthType): Promise<number> {
    return this.repository.count({
      where: { user_id: userId, auth_type: authType },
    });
  }

  /**
   * Get user's auth method statistics
   */
  async getUserAuthStats(userId: string): Promise<{
    total: number;
    byType: Record<AuthType, number>;
    primaryType: AuthType | null;
  }> {
    const methods = await this.findByUserId(userId);

    const stats = {
      total: methods.length,
      byType: {} as Record<AuthType, number>,
      primaryType: null as AuthType | null,
    };

    for (const method of methods) {
      stats.byType[method.auth_type] = (stats.byType[method.auth_type] || 0) + 1;
      if (method.is_primary) {
        stats.primaryType = method.auth_type;
      }
    }

    return stats;
  }

  /**
   * Soft delete auth method (clear tokens but keep record)
   */
  async deactivateAuthMethod(id: string): Promise<void> {
    await this.repository.update(id, {
      access_token: undefined,
      refresh_token: undefined,
      expires_at: undefined,
      scope: undefined,
      is_primary: false,
    });
  }

  /**
   * Find auth methods that need token refresh
   */
  async findTokensNeedingRefresh(bufferMinutes: number = 30): Promise<UserAuthMethod[]> {
    const bufferTime = new Date(Date.now() + bufferMinutes * 60 * 1000);

    return this.repository.createQueryBuilder('auth')
      .where('auth.auth_type IN (:...oauthTypes)', {
        oauthTypes: [AuthType.GITHUB, AuthType.GOOGLE, AuthType.WECHAT, AuthType.QQ, AuthType.APPLE],
      })
      .andWhere('auth.refresh_token IS NOT NULL')
      .andWhere('auth.expires_at IS NOT NULL')
      .andWhere('auth.expires_at < :bufferTime', { bufferTime })
      .getMany();
  }
}
