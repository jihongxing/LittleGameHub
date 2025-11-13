/**
 * UserAuthMethod Entity
 * Task: T020
 * 
 * Represents authentication methods linked to a user account (supports multiple methods per user)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuthType {
  PHONE = 'phone',
  EMAIL = 'email',
  WECHAT = 'wechat',
  QQ = 'qq',
  APPLE = 'apple',
  GITHUB = 'github',
  GOOGLE = 'google',
}

@Entity('user_auth_methods')
@Index(['user_id'])
@Index(['auth_type', 'auth_provider_id'], { unique: true })
@Index(['is_primary'])
export class UserAuthMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, user => user.auth_methods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: AuthType,
  })
  auth_type: AuthType;

  @Column({ type: 'varchar', length: 255 })
  auth_provider_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  display_name?: string;

  @Column({ type: 'text', nullable: true })
  avatar_url?: string;

  @Column({ type: 'text', nullable: true })
  access_token?: string;

  @Column({ type: 'text', nullable: true })
  refresh_token?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'Bearer' })
  token_type?: string;

  @Column({ type: 'text', nullable: true })
  scope?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_login_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  provider_data: Record<string, any> | null;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  /**
   * Validate authentication provider ID format based on auth type
   */
  static validateProviderId(authType: AuthType, providerId: string): boolean {
    switch (authType) {
      case AuthType.PHONE:
        // Basic phone number validation (supports various formats)
        return /^[\d\s\-\+\(\)]+$/.test(providerId) && providerId.length >= 10;

      case AuthType.EMAIL:
        // Email validation
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providerId);

      case AuthType.WECHAT:
      case AuthType.QQ:
      case AuthType.APPLE:
      case AuthType.GITHUB:
      case AuthType.GOOGLE:
        // OAuth provider IDs - just check they're not empty and reasonable length
        return providerId.length > 0 && providerId.length <= 255;

      default:
        return false;
    }
  }

  /**
   * Get display name for auth method
   */
  getDisplayName(): string {
    switch (this.auth_type) {
      case AuthType.PHONE:
        return `Phone: ${this.maskProviderId()}`;
      case AuthType.EMAIL:
        return `Email: ${this.maskProviderId()}`;
      case AuthType.WECHAT:
        return `WeChat: ${this.display_name || this.maskProviderId()}`;
      case AuthType.QQ:
        return `QQ: ${this.display_name || this.maskProviderId()}`;
      case AuthType.APPLE:
        return `Apple ID: ${this.email || this.maskProviderId()}`;
      case AuthType.GITHUB:
        return `GitHub: ${this.display_name || this.maskProviderId()}`;
      case AuthType.GOOGLE:
        return `Google: ${this.email || this.maskProviderId()}`;
      default:
        return 'Unknown Method';
    }
  }

  /**
   * Mask sensitive provider ID for display
   */
  maskProviderId(): string {
    if (this.auth_type === AuthType.PHONE) {
      // Show last 4 digits: ***1234
      return this.auth_provider_id.replace(/(\d{4})$/, '***$1');
    }

    if (this.auth_type === AuthType.EMAIL) {
      // Show first char and domain: u***@example.com
      const [local, domain] = this.auth_provider_id.split('@');
      return `${local[0]}***@${domain}`;
    }

    // For OAuth providers, show partial ID for privacy
    if ([AuthType.WECHAT, AuthType.QQ, AuthType.APPLE, AuthType.GITHUB, AuthType.GOOGLE].includes(this.auth_type)) {
      if (this.auth_provider_id.length <= 4) {
        return '***';
      }
      // Show first 2 and last 2 characters
      return `${this.auth_provider_id.substring(0, 2)}***${this.auth_provider_id.substring(this.auth_provider_id.length - 2)}`;
    }

    return '***';
  }

  /**
   * Check if this method can be used for authentication
   */
  isValid(): boolean {
    return UserAuthMethod.validateProviderId(this.auth_type, this.auth_provider_id);
  }

  /**
   * Get provider-specific data
   */
  getProviderData<T = Record<string, any>>(): T | null {
    return this.provider_data as T | null;
  }

  /**
   * Set provider-specific data
   */
  setProviderData(data: Record<string, any>): void {
    this.provider_data = data;
  }

  /**
   * Mark this as primary auth method (only one primary per user)
   */
  async makePrimary(): Promise<void> {
    this.is_primary = true;
    // Note: Should also unset is_primary for other methods of the same user
    // This should be handled by the service layer
  }

  /**
   * Check if access token is expired
   */
  isTokenExpired(): boolean {
    if (!this.expires_at) {
      return false; // If no expiry, assume it's valid
    }
    return new Date() > this.expires_at;
  }

  /**
   * Check if this is an OAuth provider
   */
  isOAuthProvider(): boolean {
    return [AuthType.WECHAT, AuthType.QQ, AuthType.APPLE, AuthType.GITHUB, AuthType.GOOGLE].includes(this.auth_type);
  }

  /**
   * Update OAuth token information
   */
  updateOAuthTokens(accessToken: string, refreshToken?: string, expiresIn?: number, scope?: string): void {
    this.access_token = accessToken;
    this.refresh_token = refreshToken;
    this.scope = scope;

    if (expiresIn) {
      this.expires_at = new Date(Date.now() + expiresIn * 1000);
    }

    this.last_login_at = new Date();
  }

  /**
   * Clear OAuth tokens (for logout or token revocation)
   */
  clearOAuthTokens(): void {
    this.access_token = undefined;
    this.refresh_token = undefined;
    this.expires_at = undefined;
    this.scope = undefined;
  }
}
