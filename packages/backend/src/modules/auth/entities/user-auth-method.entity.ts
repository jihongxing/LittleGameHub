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
        // Social IDs - just check they're not empty
        return providerId.length > 0;
      
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
        return 'WeChat Account';
      case AuthType.QQ:
        return 'QQ Account';
      case AuthType.APPLE:
        return 'Apple ID';
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
}
