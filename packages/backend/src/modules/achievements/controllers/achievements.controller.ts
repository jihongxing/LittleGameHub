/**
 * Achievements Controller (User Story 8)
 * T210: Implement GET /achievements endpoint
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AchievementService } from '../services/achievement.service';
import { AchievementDetectorService } from '../services/achievement-detector.service';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Uncomment when auth is ready
// import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('achievements')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
export class AchievementsController {
  constructor(
    private readonly achievementService: AchievementService,
    private readonly detectorService: AchievementDetectorService,
  ) {}

  /**
   * Get all achievements
   * GET /achievements
   */
  @Get()
  async getAllAchievements(
    @Query('includeHidden') includeHidden?: boolean,
  ) {
    const achievements = await this.achievementService.getAllAchievements(
      includeHidden === true,
    );

    return {
      achievements,
      total: achievements.length,
    };
  }

  /**
   * Get achievement by ID
   * GET /achievements/:id
   */
  @Get(':id')
  async getAchievementById(@Param('id', ParseIntPipe) id: number) {
    return this.achievementService.getAchievementById(id);
  }

  /**
   * Get achievements by category
   * GET /achievements/category/:category
   */
  @Get('category/:category')
  async getAchievementsByCategory(@Param('category') category: string) {
    const achievements = await this.achievementService.getAchievementsByCategory(category);

    return {
      achievements,
      category,
      total: achievements.length,
    };
  }

  /**
   * Get user's achievements
   * GET /achievements/user/:userId
   */
  @Get('user/:userId')
  async getUserAchievements(@Param('userId', ParseIntPipe) userId: number) {
    return this.achievementService.getUserAchievements(userId);
  }

  /**
   * Get current user's achievements
   * GET /achievements/me
   */
  @Get('me')
  async getMyAchievements(
    // @CurrentUser() user: any, // Uncomment when auth is ready
  ) {
    // TODO: Get user ID from JWT token
    const userId = 1; // Placeholder
    return this.achievementService.getUserAchievements(userId);
  }

  /**
   * Get recently unlocked achievements
   * GET /achievements/user/:userId/recent
   */
  @Get('user/:userId/recent')
  async getRecentlyUnlocked(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit', ParseIntPipe) limit: number = 5,
  ) {
    const achievements = await this.achievementService.getRecentlyUnlocked(userId, limit);

    return {
      achievements,
      total: achievements.length,
    };
  }

  /**
   * Get achievement statistics by category
   * GET /achievements/user/:userId/stats
   */
  @Get('user/:userId/stats')
  async getStatsByCategory(@Param('userId', ParseIntPipe) userId: number) {
    const statsMap = await this.achievementService.getStatsByCategory(userId);

    // Convert Map to object
    const stats: any = {};
    statsMap.forEach((value, key) => {
      stats[key] = value;
    });

    return { stats };
  }

  /**
   * Unlock achievement for user
   * POST /achievements/unlock
   */
  @Post('unlock')
  @HttpCode(HttpStatus.CREATED)
  async unlockAchievement(
    @Body() body: { user_id: number; achievement_id: number; metadata?: any },
  ) {
    const { user_id, achievement_id, metadata } = body;

    const result = await this.achievementService.unlockAchievement(
      user_id,
      achievement_id,
      metadata,
    );

    return result;
  }

  /**
   * Update achievement progress
   * POST /achievements/progress
   */
  @Post('progress')
  @HttpCode(HttpStatus.OK)
  async updateProgress(
    @Body() body: { user_id: number; achievement_id: number; progress: number },
  ) {
    const { user_id, achievement_id, progress } = body;

    await this.achievementService.updateAchievementProgress(
      user_id,
      achievement_id,
      progress,
    );

    return { success: true };
  }

  /**
   * Check and unlock achievements based on activity
   * POST /achievements/check
   */
  @Post('check')
  @HttpCode(HttpStatus.OK)
  async checkAchievements(
    @Body() body: { user_id: number; activity_type: string; value: number; metadata?: any },
  ) {
    const { user_id, activity_type, value, metadata } = body;

    const unlocked = await this.detectorService.detectAndUnlock({
      userId: user_id,
      activityType: activity_type,
      value,
      metadata,
    });

    return {
      unlocked,
      count: unlocked.length,
    };
  }

  /**
   * Get suggested achievements for user
   * GET /achievements/user/:userId/suggestions
   */
  @Get('user/:userId/suggestions')
  async getSuggestedAchievements(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit', ParseIntPipe) limit: number = 3,
  ) {
    const suggestions = await this.detectorService.getSuggestedAchievements(userId, limit);

    return {
      suggestions,
      total: suggestions.length,
    };
  }
}

