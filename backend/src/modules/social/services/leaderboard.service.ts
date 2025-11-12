/**
 * Leaderboard Service (User Story 6)
 * T159: Service for managing real-time game leaderboards
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GameSession } from '../../games/entities/game-session.entity';
import { FriendService } from './friend.service';

export interface LeaderboardQuery {
  game_id?: number;
  scope?: 'global' | 'friends';
  time_range?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  page?: number;
  limit?: number;
  user_id?: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username?: string;
  avatar?: string;
  score: number;
  games_played?: number;
  last_played_at?: Date;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  current_user_rank?: number;
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepository: Repository<GameSession>,
    private readonly friendService: FriendService,
  ) {}

  /**
   * Get leaderboard for a specific game or globally
   */
  async getLeaderboard(query: LeaderboardQuery): Promise<LeaderboardResponse> {
    const {
      game_id,
      scope = 'global',
      time_range = 'all_time',
      page = 1,
      limit = 50,
      user_id,
    } = query;

    // Build query
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('gs')
      .where('gs.completed = :completed', { completed: true });

    // Filter by game if specified
    if (game_id) {
      queryBuilder.andWhere('gs.game_id = :game_id', { game_id });
    }

    // Filter by scope (global or friends only)
    if (scope === 'friends' && user_id) {
      const friendIds = await this.friendService.getFriendIds(user_id);
      if (friendIds.length === 0) {
        // No friends, return empty leaderboard
        return {
          leaderboard: [],
          current_user_rank: undefined,
          total: 0,
          page,
          limit,
        };
      }
      // Include user and their friends
      queryBuilder.andWhere('gs.user_id IN (:...userIds)', {
        userIds: [...friendIds, user_id],
      });
    }

    // Filter by time range
    const timeFilter = this.getTimeRangeFilter(time_range);
    if (timeFilter) {
      queryBuilder.andWhere('gs.created_at >= :timeFilter', { timeFilter });
    }

    // Group by user and calculate best scores
    queryBuilder
      .select('gs.user_id', 'user_id')
      .addSelect('MAX(gs.score)', 'best_score')
      .addSelect('COUNT(gs.id)', 'games_played')
      .addSelect('MAX(gs.created_at)', 'last_played_at')
      .groupBy('gs.user_id')
      .orderBy('best_score', 'DESC')
      .addOrderBy('last_played_at', 'ASC'); // Tie-breaker: earlier achievement wins

    // Get total count
    const totalQuery = queryBuilder.clone();
    const totalResult = await totalQuery.getRawMany();
    const total = totalResult.length;

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const results = await queryBuilder.getRawMany();

    // Add rank to each entry
    const leaderboard: LeaderboardEntry[] = results.map((entry, index) => ({
      rank: offset + index + 1,
      user_id: entry.user_id,
      score: parseInt(entry.best_score, 10),
      games_played: parseInt(entry.games_played, 10),
      last_played_at: entry.last_played_at,
    }));

    // Get current user's rank if user_id is provided
    let current_user_rank: number | undefined;
    if (user_id) {
      current_user_rank = await this.getUserRank(
        user_id,
        game_id,
        scope,
        time_range,
      );
    }

    return {
      leaderboard,
      current_user_rank,
      total,
      page,
      limit,
    };
  }

  /**
   * Get user's rank in the leaderboard
   */
  async getUserRank(
    userId: number,
    gameId?: number,
    scope: 'global' | 'friends' = 'global',
    timeRange: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time',
  ): Promise<number | undefined> {
    // Build query to get user's best score
    const userScoreQuery = this.sessionRepository
      .createQueryBuilder('gs')
      .where('gs.user_id = :userId', { userId })
      .andWhere('gs.completed = :completed', { completed: true });

    if (gameId) {
      userScoreQuery.andWhere('gs.game_id = :gameId', { gameId });
    }

    const timeFilter = this.getTimeRangeFilter(timeRange);
    if (timeFilter) {
      userScoreQuery.andWhere('gs.created_at >= :timeFilter', { timeFilter });
    }

    const userBestScore = await userScoreQuery
      .select('MAX(gs.score)', 'best_score')
      .getRawOne();

    if (!userBestScore || !userBestScore.best_score) {
      return undefined;
    }

    const bestScore = parseInt(userBestScore.best_score, 10);

    // Build query to count users with higher scores
    const rankQuery = this.sessionRepository
      .createQueryBuilder('gs')
      .where('gs.completed = :completed', { completed: true });

    if (gameId) {
      rankQuery.andWhere('gs.game_id = :gameId', { gameId });
    }

    if (scope === 'friends') {
      const friendIds = await this.friendService.getFriendIds(userId);
      rankQuery.andWhere('gs.user_id IN (:...userIds)', {
        userIds: [...friendIds, userId],
      });
    }

    if (timeFilter) {
      rankQuery.andWhere('gs.created_at >= :timeFilter', { timeFilter });
    }

    // Count users with higher scores
    const higherScoresResult = await rankQuery
      .select('gs.user_id', 'user_id')
      .addSelect('MAX(gs.score)', 'best_score')
      .groupBy('gs.user_id')
      .having('MAX(gs.score) > :bestScore', { bestScore })
      .getRawMany();

    return higherScoresResult.length + 1;
  }

  /**
   * Get top players globally or for a specific game
   */
  async getTopPlayers(gameId?: number, limit = 10): Promise<LeaderboardEntry[]> {
    const result = await this.getLeaderboard({
      game_id: gameId,
      scope: 'global',
      time_range: 'all_time',
      page: 1,
      limit,
    });

    return result.leaderboard;
  }

  /**
   * Get nearby rankings for a user (users ranked above and below)
   */
  async getNearbyRankings(
    userId: number,
    gameId?: number,
    range = 5,
  ): Promise<{
    above: LeaderboardEntry[];
    current: LeaderboardEntry | null;
    below: LeaderboardEntry[];
  }> {
    const userRank = await this.getUserRank(userId, gameId);

    if (!userRank) {
      return { above: [], current: null, below: [] };
    }

    // Calculate the page that contains the user
    const limit = range * 2 + 1;
    const page = Math.floor((userRank - 1) / limit) + 1;

    const result = await this.getLeaderboard({
      game_id: gameId,
      scope: 'global',
      time_range: 'all_time',
      page,
      limit,
      user_id: userId,
    });

    // Find the current user in the results
    const currentIndex = result.leaderboard.findIndex(
      (entry) => entry.user_id === userId,
    );

    if (currentIndex === -1) {
      return { above: [], current: null, below: [] };
    }

    return {
      above: result.leaderboard.slice(Math.max(0, currentIndex - range), currentIndex),
      current: result.leaderboard[currentIndex],
      below: result.leaderboard.slice(currentIndex + 1, currentIndex + range + 1),
    };
  }

  /**
   * Get time filter based on time range
   */
  private getTimeRangeFilter(timeRange: string): Date | null {
    const now = new Date();
    switch (timeRange) {
      case 'daily':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
      case 'monthly':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo;
      case 'all_time':
      default:
        return null;
    }
  }

  /**
   * Real-time leaderboard update (for WebSocket broadcasting)
   */
  async updateLeaderboardRealtime(
    userId: number,
    gameId: number,
    newScore: number,
  ): Promise<{
    newRank: number;
    oldRank?: number;
    topPlayers: LeaderboardEntry[];
  }> {
    // Get old rank before update
    const oldRank = await this.getUserRank(userId, gameId);

    // After the game session is saved, get new rank
    const newRank = await this.getUserRank(userId, gameId);

    // Get updated top players
    const topPlayers = await this.getTopPlayers(gameId, 10);

    return {
      newRank: newRank || 0,
      oldRank,
      topPlayers,
    };
  }
}

