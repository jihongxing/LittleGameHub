/**
 * Rewards Module
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reward } from './entities/reward.entity';
import { Redemption } from './entities/redemption.entity';
import { RewardService } from './services/reward.service';
import { RewardsController } from './controllers/rewards.controller';
import { PointsModule } from '../points/points.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reward, Redemption]),
    PointsModule,
  ],
  controllers: [RewardsController],
  providers: [RewardService],
  exports: [RewardService],
})
export class RewardsModule {}
