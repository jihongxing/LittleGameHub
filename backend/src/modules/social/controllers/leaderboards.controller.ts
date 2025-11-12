/**
 * Leaderboards Controller (User Story 6)
 * T164: API endpoint for game leaderboards
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { LeaderboardService } from '../services/leaderboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// DTOs
export class GetLeaderboardQueryDto {
  game_id?: number;
  scope?: 'global' | 'friends';
  time_range?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  page?: number;
  limit?: number;
}

@Controller('leaderboards')
@UseGuards(JwtAuthGuard)
export class LeaderboardsController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /**
   * T164: GET /leaderboards - Get game leaderboard
   */
  @Get()
  async getLeaderboard(@Request() req, @Query() query: GetLeaderboardQueryDto) {
    const userId = req.user.userId || req.user.sub;

    // Validate query parameters
    const gameId = query.game_id ? parseInt(query.game_id as any, 10) : undefined;
    const scope = query.scope || 'global';
    const timeRange = query.time_range || 'all_time';
    const page = query.page ? parseInt(query.page as any, 10) : 1;
    const limit = query.limit ? parseInt(query.limit as any, 10) : 50;

    // Validate scope
    if (scope !== 'global' && scope !== 'friends') {
      throw new BadRequestException('Invalid scope. Must be "global" or "friends"');
    }

    // Validate time_range
    if (!['daily', 'weekly', 'monthly', 'all_time'].includes(timeRange)) {
      throw new BadRequestException(
        'Invalid time_range. Must be "daily", "weekly", "monthly", or "all_time"',
      );
    }

    const result = await this.leaderboardService.getLeaderboard({
      game_id: gameId,
      scope,
      time_range: timeRange,
      page,
      limit,
      user_id: userId,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /leaderboards/top - Get top players
   */
  @Get('top')
  async getTopPlayers(@Query('game_id') gameId?: number, @Query('limit') limit?: number) {
    const parsedGameId = gameId ? parseInt(gameId as any, 10) : undefined;
    const parsedLimit = limit ? parseInt(limit as any, 10) : 10;

    const topPlayers = await this.leaderboardService.getTopPlayers(
      parsedGameId,
      parsedLimit,
    );

    return {
      success: true,
      data: {
        top_players: topPlayers,
        total: topPlayers.length,
      },
    };
  }

  /**
   * GET /leaderboards/rank - Get user's rank
   */
  @Get('rank')
  async getUserRank(
    @Request() req,
    @Query('game_id') gameId?: number,
    @Query('scope') scope?: 'global' | 'friends',
    @Query('time_range') timeRange?: 'daily' | 'weekly' | 'monthly' | 'all_time',
  ) {
    const userId = req.user.userId || req.user.sub;
    const parsedGameId = gameId ? parseInt(gameId as any, 10) : undefined;
    const parsedScope = scope || 'global';
    const parsedTimeRange = timeRange || 'all_time';

    const rank = await this.leaderboardService.getUserRank(
      userId,
      parsedGameId,
      parsedScope,
      parsedTimeRange,
    );

    return {
      success: true,
      data: {
        user_id: userId,
        rank: rank || null,
        game_id: parsedGameId,
        scope: parsedScope,
        time_range: parsedTimeRange,
      },
    };
  }

  /**
   * GET /leaderboards/nearby - Get nearby rankings
   */
  @Get('nearby')
  async getNearbyRankings(
    @Request() req,
    @Query('game_id') gameId?: number,
    @Query('range') range?: number,
  ) {
    const userId = req.user.userId || req.user.sub;
    const parsedGameId = gameId ? parseInt(gameId as any, 10) : undefined;
    const parsedRange = range ? parseInt(range as any, 10) : 5;

    const nearbyRankings = await this.leaderboardService.getNearbyRankings(
      userId,
      parsedGameId,
      parsedRange,
    );

    return {
      success: true,
      data: nearbyRankings,
    };
  }

  /**
   * GET /leaderboards/games/:gameId - Get leaderboard for specific game
   */
  @Get('games/:gameId')
  async getGameLeaderboard(
    @Request() req,
    @Param('gameId', ParseIntPipe) gameId: number,
    @Query() query: Omit<GetLeaderboardQueryDto, 'game_id'>,
  ) {
    const userId = req.user.userId || req.user.sub;

    const scope = query.scope || 'global';
    const timeRange = query.time_range || 'all_time';
    const page = query.page ? parseInt(query.page as any, 10) : 1;
    const limit = query.limit ? parseInt(query.limit as any, 10) : 50;

    const result = await this.leaderboardService.getLeaderboard({
      game_id: gameId,
      scope,
      time_range: timeRange,
      page,
      limit,
      user_id: userId,
    });

    return {
      success: true,
      data: result,
    };
  }
}

// Missing Param decorator import
import { Param } from '@nestjs/common';

