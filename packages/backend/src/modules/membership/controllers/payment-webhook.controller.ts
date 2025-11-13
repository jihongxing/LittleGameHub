/**
 * Payment Webhook Controller
 * Handles payment provider callbacks/webhooks
 * T108: Implement payment webhook handler
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { MembershipService } from '../services/membership.service';

@Controller('webhooks/payment')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly membershipService: MembershipService,
  ) {}

  /**
   * Alipay payment callback
   */
  @Post('alipay')
  @HttpCode(HttpStatus.OK)
  async handleAlipayCallback(
    @Body() body: any,
    @Headers('x-alipay-signature') signature: string,
  ) {
    this.logger.log('Received Alipay callback');

    try {
      // Verify signature
      const isValid = await this.paymentService.verifyPayment(
        body.out_trade_no,
        signature || body.sign,
      );

      if (!isValid) {
        throw new BadRequestException('Invalid signature');
      }

      // Handle payment result
      const result = await this.paymentService.handlePaymentCallback(body);

      // If payment successful, activate membership
      if (result.success && body.membership_id) {
        await this.membershipService.activateMembership(
          body.membership_id,
          result.payment_id,
        );
        this.logger.log(`Activated membership ${body.membership_id}`);
      }

      // Return success response required by Alipay
      return { code: 'success', message: 'Payment processed' };
    } catch (error: any) {
      this.logger.error(`Alipay callback error: ${error.message}`);
      return { code: 'fail', message: error.message };
    }
  }

  /**
   * WeChat Pay payment callback
   */
  @Post('wechatpay')
  @HttpCode(HttpStatus.OK)
  async handleWeChatPayCallback(
    @Body() body: any,
    @Headers('wechatpay-signature') signature: string,
  ) {
    this.logger.log('Received WeChat Pay callback');

    try {
      // Verify signature
      const isValid = await this.paymentService.verifyPayment(
        body.out_trade_no,
        signature,
      );

      if (!isValid) {
        throw new BadRequestException('Invalid signature');
      }

      // Decrypt resource (WeChat Pay uses encrypted callback)
      // const decrypted = await this.decryptWeChatPayResource(body.resource);

      // Handle payment result
      const result = await this.paymentService.handlePaymentCallback(body);

      // If payment successful, activate membership
      if (result.success && body.membership_id) {
        await this.membershipService.activateMembership(
          body.membership_id,
          result.payment_id,
        );
        this.logger.log(`Activated membership ${body.membership_id}`);
      }

      // Return success response required by WeChat Pay
      return { code: 'SUCCESS', message: 'Payment processed' };
    } catch (error: any) {
      this.logger.error(`WeChat Pay callback error: ${error.message}`);
      return { code: 'FAIL', message: error.message };
    }
  }

  /**
   * Apple In-App Purchase receipt validation
   */
  @Post('apple')
  @HttpCode(HttpStatus.OK)
  async handleAppleIAPCallback(@Body() body: any) {
    this.logger.log('Received Apple IAP receipt');

    try {
      const { receipt_data, membership_id } = body;

      if (!receipt_data) {
        throw new BadRequestException('Receipt data required');
      }

      // Validate receipt with Apple
      const isValid = await this.paymentService.validateAppleReceipt(receipt_data);

      if (!isValid) {
        throw new BadRequestException('Invalid receipt');
      }

      // Activate membership
      if (membership_id) {
        await this.membershipService.activateMembership(
          membership_id,
          `apple_${Date.now()}`,
        );
        this.logger.log(`Activated membership ${membership_id} via Apple IAP`);
      }

      return { success: true, message: 'Receipt validated and membership activated' };
    } catch (error: any) {
      this.logger.error(`Apple IAP validation error: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  /**
   * Generic payment status query endpoint
   */
  @Post('status')
  @HttpCode(HttpStatus.OK)
  async queryPaymentStatus(@Body() body: { payment_id: string }) {
    const { payment_id } = body;

    if (!payment_id) {
      throw new BadRequestException('Payment ID required');
    }

    const status = await this.paymentService.queryPaymentStatus(payment_id);

    return { payment_id, status };
  }
}

