/**
 * Achievements Module (User Story 8)
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement, UserAchievement } from './entities/achievement.entity';
import { AchievementService } from './services/achievement.service';
import { AchievementDetectorService } from './services/achievement-detector.service';
import { AchievementsController } from './controllers/achievements.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Achievement, UserAchievement]),
  ],
  providers: [AchievementService, AchievementDetectorService],
  controllers: [AchievementsController],
  exports: [AchievementService, AchievementDetectorService],
})
export class AchievementsModule {}

