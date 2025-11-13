/**
 * Invitations Module
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';
import { User } from '../users/entities/user.entity';
import { InvitationService } from './services/invitation.service';
import { InvitationRewardService } from './services/invitation-reward.service';
import { InvitationValidationService } from './services/invitation-validation.service';
import { InvitationsController } from './controllers/invitations.controller';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, User]),
    PointsModule,
  ],
  controllers: [InvitationsController],
  providers: [
    InvitationService,
    InvitationRewardService,
    InvitationValidationService,
  ],
  exports: [
    InvitationService,
    InvitationRewardService,
    InvitationValidationService,
  ],
})
export class InvitationsModule {}

