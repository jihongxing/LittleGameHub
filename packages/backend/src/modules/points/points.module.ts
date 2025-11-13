/**
 * Points Module
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointTransaction } from './entities/point-transaction.entity';
import { User } from '../users/entities/user.entity';
import { PointService } from './services/point.service';
import { PointCalculationService } from './services/point-calculation.service';
import { PointTaskService } from './services/point-task.service';
import { PointsController } from './controllers/points.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PointTransaction, User])],
  controllers: [PointsController],
  providers: [PointService, PointCalculationService, PointTaskService],
  exports: [PointService, PointCalculationService, PointTaskService],
})
export class PointsModule {}
