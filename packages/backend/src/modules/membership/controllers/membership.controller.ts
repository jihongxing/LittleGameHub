/**
 * Membership Controller
 * Handles HTTP requests for membership management
 * T105: Implement GET /membership endpoint
 * T106: Implement GET /membership/plans endpoint
 * T107: Implement POST /membership/subscribe endpoint
 */

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { MembershipService } from '../services/membership.service';
import { PaymentService, PaymentMethod } from '../services/payment.service';
import { RefundService, RefundReason } from '../services/refund.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { MembershipTier } from '../entities/membership.entity';

class SubscribeDto {
  tier: MembershipTier;
  payment_method: PaymentMethod;
  return_url?: string;
}

class RefundRequestDto {
  reason: RefundReason;
  description?: string;
}

@Controller('membership')
export class MembershipController {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly paymentService: PaymentService,
    private readonly refundService: RefundService,
  ) {}

  /**
   * T106: GET /membership/plans - Get available membership plans
   */
  @Get('plans')
  @HttpCode(HttpStatus.OK)
  getPlans() {
    const plans = this.membershipService.getPlans();
    return { plans };
  }

  /**
   * T105: GET /membership - Get user's current membership
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCurrentMembership(@CurrentUser() user: any) {
    const userId = user.id || user.sub;

    const [membership, tier, pointMultiplier, history] = await Promise.all([
      this.membershipService.getCurrentMembership(userId),
      this.membershipService.getMembershipTier(userId),
      this.membershipService.getPointMultiplier(userId),
      this.membershipService.getMembershipHistory(userId),
    ]);

    return {
      current_membership: membership || null,
      tier,
      point_multiplier: pointMultiplier,
      privileges: {
        ad_free: await this.membershipService.hasPrivilege(userId, 'ad_free'),
        cloud_save: await this.membershipService.hasPrivilege(userId, 'cloud_save'),
        offline_download: await this.membershipService.hasPrivilege(userId, 'offline_download'),
        all_games: await this.membershipService.hasPrivilege(userId, 'all_games'),
      },
      history: history,
    };
  }

  /**
   * T107: POST /membership/subscribe - Subscribe to membership
   */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async subscribe(@CurrentUser() user: any, @Body() dto: SubscribeDto) {
    const userId = user.id || user.sub;

    // Create subscription
    const subscription = await this.membershipService.subscribe(userId, dto.tier);

    // Create payment order if payment required
    if (subscription.payment_required) {
      const payment = await this.paymentService.createPayment({
        user_id: userId,
        membership_id: subscription.membership_id,
        amount: subscription.payment_amount!,
        method: dto.payment_method,
        return_url: dto.return_url,
      });

      return {
        subscription,
        payment,
      };
    }

    return { subscription };
  }

  /**
   * Cancel subscription
   */
  @Delete('subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@CurrentUser() user: any) {
    const userId = user.id || user.sub;
    await this.membershipService.cancelSubscription(userId);
    return { message: 'Subscription cancelled successfully' };
  }

  /**
   * Request refund
   */
  @Post('refund')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async requestRefund(@CurrentUser() user: any, @Body() dto: RefundRequestDto) {
    const userId = user.id || user.sub;

    // Get current membership
    const membership = await this.membershipService.getCurrentMembership(userId);
    if (!membership) {
      return { error: 'No active membership found' };
    }

    // Request refund
    const refund = await this.refundService.requestRefund({
      membership_id: membership.id,
      user_id: userId,
      reason: dto.reason,
      description: dto.description,
    });

    // Process refund if approved
    if (refund.status === 'approved') {
      await this.refundService.processRefund(refund.refund_id, membership.id);
    }

    return { refund };
  }

  /**
   * Check refund eligibility
   */
  @Get('refund/eligibility')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async checkRefundEligibility(@CurrentUser() user: any) {
    const userId = user.id || user.sub;

    const membership = await this.membershipService.getCurrentMembership(userId);
    if (!membership) {
      return { eligible: false, reason: 'No active membership' };
    }

    return this.refundService.checkRefundEligibility(membership.id);
  }
}

