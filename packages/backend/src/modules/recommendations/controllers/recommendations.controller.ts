/**
 * Recommendations Controller
 * Handles HTTP requests for recommendations
 * T144: Implement GET /recommendations endpoint
 */

import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecommendationService } from '../services/recommendation.service';
import { ScenarioRecommendationService } from '../services/scenario-recommendation.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RecommendationScenario } from '../entities/recommendation.entity';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly scenarioService: ScenarioRecommendationService,
  ) {}

  /**
   * T144: GET /recommendations - Get personalized recommendations
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getRecommendations(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('scenario') scenario?: RecommendationScenario,
    @Query('exclude') exclude?: string,
  ) {
    if (!user) {
      // Return scenario-based recommendations for unauthenticated users
      const scenarioValue = (scenario || RecommendationScenario.ANY) as RecommendationScenario;
      const recommendations = await this.scenarioService.getScenarioRecommendations(
        scenarioValue,
        {
          limit: limit ? parseInt(String(limit)) : 10,
          excludeGameIds: (exclude as string)?.split(',') || [],
        },
      );
      const config = this.scenarioService.getScenarioConfig(scenarioValue);
      return {
        recommendations,
        scenario: scenarioValue,
      };
    }

    const userId = user.id || user.sub;

    // Parse excluded game IDs
    const excludeGameIds = exclude ? exclude.split(',') : [];

    // Get recommendations
    const recommendations = await this.recommendationService.getRecommendationsForUser(
      userId,
      {
        limit: limit ? parseInt(String(limit)) : 10,
        scenario: scenario || RecommendationScenario.ANY,
        excludeGameIds,
      },
    );

    return {
      recommendations,
      scenario: scenario || this.scenarioService.detectCurrentScenario(),
    };
  }

  /**
   * GET /recommendations/scenarios - Get available scenarios
   */
  @Get('scenarios')
  @HttpCode(HttpStatus.OK)
  getScenarios() {
    const scenarios = this.scenarioService.getAvailableScenarios();
    const current = this.scenarioService.detectCurrentScenario();

    return {
      scenarios: scenarios.map((s) => ({
        scenario: s.scenario,
        description: s.description,
        max_duration: s.maxDuration,
        categories: s.categories,
      })),
      current_scenario: current,
    };
  }

  /**
   * GET /recommendations/scenario/:scenario - Get scenario-based recommendations
   */
  @Get('scenario/:scenario')
  @HttpCode(HttpStatus.OK)
  async getScenarioRecommendations(
    @Param('scenario') scenario: RecommendationScenario,
    @Query('limit') limit?: number,
    @Query('exclude') exclude?: string,
  ) {
    const excludeGameIds = exclude ? exclude.split(',') : [];

    const recommendations = await this.scenarioService.getScenarioRecommendations(
      scenario,
      {
        limit: limit ? parseInt(String(limit)) : 10,
        excludeGameIds,
      },
    );

    const config = this.scenarioService.getScenarioConfig(scenario);

    return {
      recommendations,
      scenario_config: config
        ? {
            scenario: config.scenario,
            description: config.description,
            max_duration: config.maxDuration,
            categories: config.categories,
          }
        : null,
    };
  }

  /**
   * POST /recommendations/:id/click - Track recommendation click
   */
  @Post(':id/click')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async trackClick(@Param('id') recommendationId: string) {
    await this.recommendationService.trackClick(recommendationId);
    return { success: true };
  }

  /**
   * POST /recommendations/track-play - Track game play from recommendation
   */
  @Post('track-play')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async trackPlay(
    @CurrentUser() user: any,
    @Query('game_id') gameId: string,
  ) {
    const userId = user.id || user.sub;
    await this.recommendationService.trackPlay(userId, gameId);
    return { success: true };
  }
}

