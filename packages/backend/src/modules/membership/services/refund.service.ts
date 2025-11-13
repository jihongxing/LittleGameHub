/**
 * Refund Service
 * Handles refund processing for membership subscriptions
 * T103: Implement refund processing service
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Membership, MembershipStatus } from '../entities/membership.entity';

export enum RefundReason {
  USER_REQUEST = 'user_request',
  TECHNICAL_ISSUE = 'technical_issue',
  DUPLICATE_PAYMENT = 'duplicate_payment',
  SERVICE_NOT_PROVIDED = 'service_not_provided',
  OTHER = 'other',
}

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface RefundRequest {
  membership_id: string;
  user_id: string;
  reason: RefundReason;
  description?: string;
}

export interface RefundResult {
  refund_id: string;
  status: RefundStatus;
  amount: number;
  estimated_days: number;
}

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);
  private readonly REFUND_WINDOW_DAYS = 7; // 7-day refund window

  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Request a refund
   */
  async requestRefund(request: RefundRequest): Promise<RefundResult> {
    this.logger.log(`Processing refund request for membership ${request.membership_id}`);

    // Get membership
    const membership = await this.membershipRepository.findOne({
      where: { id: request.membership_id, userId: request.user_id },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Check if within refund window
    const daysSinceStart = this.getDaysSince(membership.startDate);
    if (daysSinceStart > this.REFUND_WINDOW_DAYS) {
      throw new BadRequestException(
        `Refund window expired. Refunds must be requested within ${this.REFUND_WINDOW_DAYS} days of purchase.`
      );
    }

    // Check if already refunded
    if (membership.status === MembershipStatus.REFUNDED) {
      throw new BadRequestException('This membership has already been refunded');
    }

    // Calculate refund amount (prorated based on usage)
    const refundAmount = this.calculateRefundAmount(membership);

    // Generate refund ID
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In production, integrate with payment provider's refund API
    // For MVP, auto-approve refunds
    const status = RefundStatus.APPROVED;

    this.logger.log(`Refund request approved: ${refundId}, amount: ${refundAmount}`);

    return {
      refund_id: refundId,
      status,
      amount: refundAmount,
      estimated_days: 7, // Typical refund processing time
    };
  }

  /**
   * Process approved refund
   */
  async processRefund(refundId: string, membershipId: string): Promise<void> {
    this.logger.log(`Processing refund ${refundId} for membership ${membershipId}`);

    return this.dataSource.transaction(async (manager) => {
      const membership = await manager.findOne(Membership, {
        where: { id: membershipId },
      });

      if (!membership) {
        throw new NotFoundException('Membership not found');
      }

      // Update membership status
      membership.status = MembershipStatus.REFUNDED;
      membership.autoRenew = false;
      await manager.save(membership);

      // In production, call payment provider's refund API
      // await this.paymentProvider.refund(...)

      this.logger.log(`Refund processed successfully: ${refundId}`);
    });
  }

  /**
   * Calculate refund amount (prorated)
   */
  private calculateRefundAmount(membership: Membership): number {
    // Get original payment amount (from plan price)
    // For MVP, use fixed amounts based on tier
    const tierPrices: Record<string, number> = {
      basic: 15,
      premium: 30,
      offline: 50,
    };

    const totalAmount = tierPrices[membership.tier] || 0;

    // Calculate days used vs total days
    if (!membership.endDate) {
      return 0; // Cannot calculate refund without end date
    }
    const totalDays = this.getDaysBetween(membership.startDate, membership.endDate);
    const daysUsed = this.getDaysSince(membership.startDate);
    const daysRemaining = Math.max(0, totalDays - daysUsed);

    // Prorated refund
    const refundAmount = (totalAmount * daysRemaining) / totalDays;

    return Math.max(0, Math.floor(refundAmount * 100) / 100); // Round to 2 decimals
  }

  /**
   * Check refund eligibility
   */
  async checkRefundEligibility(membershipId: string): Promise<{
    eligible: boolean;
    reason?: string;
    refund_amount?: number;
  }> {
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId },
    });

    if (!membership) {
      return { eligible: false, reason: 'Membership not found' };
    }

    if (membership.status === MembershipStatus.REFUNDED) {
      return { eligible: false, reason: 'Already refunded' };
    }

    const daysSinceStart = this.getDaysSince(membership.startDate);
    if (daysSinceStart > this.REFUND_WINDOW_DAYS) {
      return {
        eligible: false,
        reason: `Refund window expired (${this.REFUND_WINDOW_DAYS} days)`,
      };
    }

    const refundAmount = this.calculateRefundAmount(membership);

    return {
      eligible: true,
      refund_amount: refundAmount,
    };
  }

  /**
   * Get refund status
   */
  async getRefundStatus(refundId: string): Promise<RefundStatus> {
    // In production, query actual refund status from payment provider
    // For MVP, simulate completed status
    this.logger.log(`Querying refund status: ${refundId}`);
    return RefundStatus.COMPLETED;
  }

  /**
   * Cancel refund request
   */
  async cancelRefund(refundId: string): Promise<void> {
    this.logger.log(`Cancelling refund request: ${refundId}`);
    // In production, call payment provider's cancel refund API
  }

  /**
   * Helper: Get days since a date
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Helper: Get days between two dates
   */
  private getDaysBetween(startDate: Date, endDate: Date): number {
    const diff = endDate.getTime() - startDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

