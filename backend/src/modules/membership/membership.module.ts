/**
 * Membership Module
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { User } from '../users/entities/user.entity';
import { MembershipService } from './services/membership.service';
import { PaymentService } from './services/payment.service';
import { RefundService } from './services/refund.service';
import { MembershipController } from './controllers/membership.controller';
import { PaymentWebhookController } from './controllers/payment-webhook.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Membership, User])],
  controllers: [MembershipController, PaymentWebhookController],
  providers: [MembershipService, PaymentService, RefundService],
  exports: [MembershipService, PaymentService, RefundService],
})
export class MembershipModule {}

