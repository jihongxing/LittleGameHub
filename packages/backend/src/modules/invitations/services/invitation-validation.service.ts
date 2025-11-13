/**
 * Invitation Validation Service
 * Prevents invitation abuse (duplicate accounts, self-invitations)
 * T126: Implement invitation abuse prevention
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from '../entities/invitation.entity';
import { User } from '../../users/entities/user.entity';

export enum ValidationResult {
  VALID = 'valid',
  SELF_INVITATION = 'self_invitation',
  DUPLICATE_IP = 'duplicate_ip',
  DUPLICATE_DEVICE = 'duplicate_device',
  TOO_MANY_INVITATIONS = 'too_many_invitations',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
}

export interface ValidationResponse {
  valid: boolean;
  reason?: ValidationResult;
  message?: string;
}

@Injectable()
export class InvitationValidationService {
  private readonly logger = new Logger(InvitationValidationService.name);

  // Fraud detection thresholds
  private readonly MAX_INVITATIONS_PER_IP = 5;
  private readonly MAX_INVITATIONS_PER_DEVICE = 3;
  private readonly MAX_INVITATIONS_PER_USER_PER_DAY = 10;

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Validate invitation usage
   */
  async validateInvitation(
    invitationCode: string,
    inviteeId: string,
    ip?: string,
    deviceFingerprint?: string,
  ): Promise<ValidationResponse> {
    // Get invitation
    const invitation = await this.invitationRepository.findOne({
      where: { invitationCode },
    });

    if (!invitation) {
      return {
        valid: false,
        reason: ValidationResult.VALID,
        message: 'Invitation not found',
      };
    }

    // Check for self-invitation
    if (invitation.inviterId === inviteeId) {
      this.logger.warn(`Self-invitation attempt: user ${inviteeId}`);
      return {
        valid: false,
        reason: ValidationResult.SELF_INVITATION,
        message: '不能使用自己的邀请码',
      };
    }

    // Check for duplicate IP
    if (ip) {
      const sameIpCount = await this.invitationRepository.count({
        where: {
          inviterId: invitation.inviterId,
          inviteeIp: ip,
        },
      });

      if (sameIpCount >= this.MAX_INVITATIONS_PER_IP) {
        this.logger.warn(`Too many invitations from IP ${ip}`);
        return {
          valid: false,
          reason: ValidationResult.DUPLICATE_IP,
          message: '该IP地址已达到邀请上限',
        };
      }
    }

    // Check for duplicate device
    if (deviceFingerprint) {
      const sameDeviceCount = await this.invitationRepository.count({
        where: {
          inviterId: invitation.inviterId,
          deviceFingerprint,
        },
      });

      if (sameDeviceCount >= this.MAX_INVITATIONS_PER_DEVICE) {
        this.logger.warn(`Too many invitations from device ${deviceFingerprint}`);
        return {
          valid: false,
          reason: ValidationResult.DUPLICATE_DEVICE,
          message: '该设备已达到邀请上限',
        };
      }
    }

    // Check for suspicious patterns
    const isSuspicious = await this.detectSuspiciousPattern(invitation.inviterId);
    if (isSuspicious) {
      this.logger.warn(`Suspicious invitation pattern detected for user ${invitation.inviterId}`);
      return {
        valid: false,
        reason: ValidationResult.SUSPICIOUS_PATTERN,
        message: '检测到异常邀请模式',
      };
    }

    return {
      valid: true,
    };
  }

  /**
   * Check if user can generate new invitation
   */
  async canUserGenerateInvitation(userId: string): Promise<ValidationResponse> {
    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await this.invitationRepository.count({
      where: {
        inviterId: userId,
      },
    });

    if (todayCount >= this.MAX_INVITATIONS_PER_USER_PER_DAY) {
      return {
        valid: false,
        reason: ValidationResult.TOO_MANY_INVITATIONS,
        message: `每日最多生成 ${this.MAX_INVITATIONS_PER_USER_PER_DAY} 个邀请`,
      };
    }

    return {
      valid: true,
    };
  }

  /**
   * Detect suspicious patterns
   */
  private async detectSuspiciousPattern(inviterId: string): Promise<boolean> {
    // Check if user accepted invitations very quickly (< 1 minute apart)
    const recentInvitations = await this.invitationRepository.find({
      where: { inviterId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    if (recentInvitations.length >= 3) {
      const timestamps = recentInvitations.map((inv) => inv.createdAt.getTime());
      
      // Check for invitations within 1 minute of each other
      for (let i = 0; i < timestamps.length - 1; i++) {
        const timeDiff = timestamps[i] - timestamps[i + 1];
        if (timeDiff < 60000) {
          // Less than 1 minute
          return true;
        }
      }
    }

    // Check for same IP addresses
    const ipAddresses = recentInvitations
      .filter((inv) => inv.inviteeIp)
      .map((inv) => inv.inviteeIp);

    const uniqueIps = new Set(ipAddresses);
    if (uniqueIps.size < ipAddresses.length / 2) {
      // More than half share IPs
      return true;
    }

    return false;
  }

  /**
   * Check if user has used an invitation before
   */
  async hasUserUsedInvitation(userId: string): Promise<boolean> {
    const count = await this.invitationRepository.count({
      where: { inviteeId: userId },
    });

    return count > 0;
  }

  /**
   * Report suspicious invitation
   */
  async reportSuspiciousInvitation(
    invitationId: string,
    reason: string,
  ): Promise<void> {
    this.logger.warn(`Suspicious invitation reported: ${invitationId}, reason: ${reason}`);
    // In production, implement actual reporting/flagging mechanism
  }

  /**
   * Block user from creating invitations
   */
  async blockUserInvitations(userId: string, reason: string): Promise<void> {
    this.logger.warn(`Blocked user ${userId} from creating invitations: ${reason}`);
    // In production, implement actual blocking mechanism
    // Could add a blocked_users table or flag on user entity
  }
}

