/**
 * Payment Service
 * Handles payment processing for membership subscriptions
 * T101: Implement payment processing service (WeChat Pay, Alipay, Apple IAP)
 * T102: Implement payment retry logic (3 attempts)
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from '../entities/membership.entity';

export enum PaymentMethod {
  WECHAT_PAY = 'wechat_pay',
  ALIPAY = 'alipay',
  APPLE_IAP = 'apple_iap',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface PaymentRequest {
  user_id: string;
  membership_id: string;
  amount: number;
  method: PaymentMethod;
  return_url?: string;
}

export interface PaymentResult {
  payment_id: string;
  status: PaymentStatus;
  payment_url?: string;
  qr_code?: string;
  order_id?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  /**
   * Create payment order
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    this.logger.log(`Creating payment for user ${request.user_id}, method: ${request.method}`);

    // Validate amount
    if (request.amount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    // Route to appropriate payment provider
    switch (request.method) {
      case PaymentMethod.ALIPAY:
        return this.createAlipayOrder(request);
      case PaymentMethod.WECHAT_PAY:
        return this.createWeChatPayOrder(request);
      case PaymentMethod.APPLE_IAP:
        return this.createAppleIAPOrder(request);
      default:
        throw new BadRequestException('Unsupported payment method');
    }
  }

  /**
   * Create Alipay order
   */
  private async createAlipayOrder(request: PaymentRequest): Promise<PaymentResult> {
    // In production, integrate with Alipay SDK
    // For MVP, simulate payment creation
    const paymentId = `alipay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderId = `order_${Date.now()}`;

    this.logger.log(`Created Alipay order: ${orderId}`);

    return {
      payment_id: paymentId,
      status: PaymentStatus.PENDING,
      payment_url: `https://openapi.alipay.com/gateway.do?order_id=${orderId}`,
      order_id: orderId,
    };
  }

  /**
   * Create WeChat Pay order
   */
  private async createWeChatPayOrder(request: PaymentRequest): Promise<PaymentResult> {
    // In production, integrate with WeChat Pay SDK
    // For MVP, simulate payment creation
    const paymentId = `wxpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderId = `order_${Date.now()}`;

    this.logger.log(`Created WeChat Pay order: ${orderId}`);

    return {
      payment_id: paymentId,
      status: PaymentStatus.PENDING,
      qr_code: `weixin://wxpay/bizpayurl?order_id=${orderId}`,
      order_id: orderId,
    };
  }

  /**
   * Create Apple In-App Purchase order
   */
  private async createAppleIAPOrder(request: PaymentRequest): Promise<PaymentResult> {
    // In production, integrate with Apple IAP
    // For MVP, simulate payment creation
    const paymentId = `apple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`Created Apple IAP transaction: ${paymentId}`);

    return {
      payment_id: paymentId,
      status: PaymentStatus.PENDING,
    };
  }

  /**
   * Process payment with retry logic (T102)
   */
  async processPayment(
    paymentId: string,
    attempt: number = 1,
  ): Promise<{ success: boolean; status: PaymentStatus }> {
    this.logger.log(`Processing payment ${paymentId}, attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS}`);

    try {
      // Simulate payment processing
      // In production, call actual payment provider API
      const success = Math.random() > 0.2; // 80% success rate for simulation

      if (success) {
        this.logger.log(`Payment ${paymentId} completed successfully`);
        return { success: true, status: PaymentStatus.COMPLETED };
      } else {
        throw new Error('Payment processing failed');
      }
    } catch (error: any) {
      this.logger.warn(`Payment ${paymentId} failed on attempt ${attempt}: ${error.message}`);

      // Retry logic
      if (attempt < this.MAX_RETRY_ATTEMPTS) {
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await this.sleep(delay);

        return this.processPayment(paymentId, attempt + 1);
      } else {
        this.logger.error(`Payment ${paymentId} failed after ${this.MAX_RETRY_ATTEMPTS} attempts`);
        return { success: false, status: PaymentStatus.FAILED };
      }
    }
  }

  /**
   * Verify payment callback
   */
  async verifyPayment(paymentId: string, signature: string): Promise<boolean> {
    // In production, verify signature with payment provider's public key
    // For MVP, simulate verification
    this.logger.log(`Verifying payment ${paymentId}`);

    // Simulate verification (always pass for MVP)
    return true;
  }

  /**
   * Query payment status
   */
  async queryPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    // In production, query actual payment provider
    // For MVP, simulate query
    this.logger.log(`Querying payment status: ${paymentId}`);

    // Simulate random status
    const statuses = [PaymentStatus.PENDING, PaymentStatus.COMPLETED, PaymentStatus.FAILED];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  /**
   * Handle payment callback/webhook
   */
  async handlePaymentCallback(data: any): Promise<{ success: boolean; payment_id: string }> {
    const paymentId = data.payment_id || data.out_trade_no;
    const status = data.trade_status || data.result_code;

    this.logger.log(`Received payment callback for ${paymentId}: ${status}`);

    // Verify callback authenticity
    const isValid = await this.verifyPayment(paymentId, data.signature);
    if (!isValid) {
      throw new BadRequestException('Invalid payment callback signature');
    }

    // Process based on status
    if (status === 'TRADE_SUCCESS' || status === 'SUCCESS') {
      return { success: true, payment_id: paymentId };
    } else {
      return { success: false, payment_id: paymentId };
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string): Promise<void> {
    this.logger.log(`Cancelling payment: ${paymentId}`);
    // In production, call payment provider's cancel API
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate payment QR code (for WeChat/Alipay)
   */
  async generateQRCode(paymentUrl: string): Promise<string> {
    // In production, use QR code library like qrcode
    // For MVP, return the URL
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text>${paymentUrl}</text></svg>`;
  }

  /**
   * Validate Apple IAP receipt
   */
  async validateAppleReceipt(receiptData: string): Promise<boolean> {
    // In production, validate with Apple's servers
    // For MVP, always return true
    this.logger.log('Validating Apple IAP receipt');
    return true;
  }
}

