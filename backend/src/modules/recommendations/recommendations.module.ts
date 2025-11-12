/**
 * Recommendations Module
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recommendation } from './entities/recommendation.entity';
import { Game } from '../games/entities/game.entity';
import { GameSession } from '../games/entities/game-session.entity';
import { RecommendationService } from './services/recommendation.service';
import { ScenarioRecommendationService } from './services/scenario-recommendation.service';
import { RecommendationsController } from './controllers/recommendations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Recommendation, Game, GameSession])],
  controllers: [RecommendationsController],
  providers: [RecommendationService, ScenarioRecommendationService],
  exports: [RecommendationService, ScenarioRecommendationService],
})
export class RecommendationsModule {}

