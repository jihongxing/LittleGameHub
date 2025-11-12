/**
 * Rewards Controller
 * Handles HTTP requests for rewards and redemptions
 * T080-T081: Implement rewards API endpoints
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RewardService } from '../services/reward.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RewardType } from '../entities/reward.entity';

class RedeemRewardDto {
  confirmation: boolean;
}

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardService: RewardService) {}

  /**
   * T080: GET /rewards - Get available rewards
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getRewards(
    @Query('type') type?: RewardType,
    @Query('min_points') minPoints?: number,
    @Query('max_points') maxPoints?: number,
    @Query('featured') featured?: string,
  ) {
    const { rewards } = await this.rewardService.getRewards({
      type,
      min_points: minPoints ? parseInt(String(minPoints)) : undefined,
      max_points: maxPoints ? parseInt(String(maxPoints)) : undefined,
      featured: featured === 'true',
    });

    return {
      rewards: rewards.map((r) => r.toJSON()),
    };
  }

  /**
   * Get reward details
   */
  @Get(':rewardId')
  @HttpCode(HttpStatus.OK)
  async getReward(@Param('rewardId', ParseUUIDPipe) rewardId: string) {
    const reward = await this.rewardService.getRewardById(rewardId);
    return reward.toJSON();
  }

  /**
   * T081: POST /rewards/{rewardId}/redeem - Redeem a reward
   */
  @Post(':rewardId/redeem')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async redeemReward(
    @CurrentUser() user: any,
    @Param('rewardId', ParseUUIDPipe) rewardId: string,
    @Body() dto: RedeemRewardDto,
  ) {
    const userId = user.id || user.sub;
    return this.rewardService.redeemReward(userId, rewardId, dto.confirmation);
  }

  /**
   * Get user's redemption history
   */
  @Get('redemptions/history')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getRedemptionHistory(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = user.id || user.sub;

    const { redemptions, total } = await this.rewardService.getRedemptionHistory(userId, {
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 20,
    });

    return {
      redemptions: redemptions.map((r) => r.toJSON()),
      pagination: {
        page: page || 1,
        limit: limit || 20,
        total,
        total_pages: Math.ceil(total / (limit || 20)),
      },
    };
  }
}
