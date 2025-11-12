/**
 * Recommendation Service
 * Implements basic recommendation algorithm (rule-based for MVP)
 * T142: Implement basic recommendation algorithm
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Recommendation,
  RecommendationType,
  RecommendationScenario,
} from '../entities/recommendation.entity';
import { Game } from '../../games/entities/game.entity';
import { GameSession } from '../../games/entities/game-session.entity';

export interface RecommendationResult {
  game_id: string;
  score: number;
  reason: string;
  type: RecommendationType;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectRepository(Recommendation)
    private readonly recommendationRepository: Repository<Recommendation>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
  ) {}

  /**
   * Get personalized recommendations for user
   */
  async getRecommendationsForUser(
    userId: string,
    options: {
      limit?: number;
      scenario?: RecommendationScenario;
      excludeGameIds?: string[];
    } = {},
  ): Promise<RecommendationResult[]> {
    const { limit = 10, scenario = RecommendationScenario.ANY, excludeGameIds = [] } = options;

    // Get user's play history
    const playHistory = await this.getUserPlayHistory(userId);

    // Combine different recommendation strategies
    const recommendations: RecommendationResult[] = [];

    // 1. Popular games (20% weight)
    const popular = await this.getPopularGames(limit, excludeGameIds);
    recommendations.push(...popular.map((r) => ({ ...r, type: RecommendationType.POPULAR })));

    // 2. Similar games based on history (40% weight)
    if (playHistory.length > 0) {
      const similar = await this.getSimilarGames(playHistory, limit, excludeGameIds);
      recommendations.push(...similar.map((r) => ({ ...r, type: RecommendationType.SIMILAR })));
    }

    // 3. Trending games (20% weight)
    const trending = await this.getTrendingGames(limit, excludeGameIds);
    recommendations.push(...trending.map((r) => ({ ...r, type: RecommendationType.TRENDING })));

    // 4. Personalized based on preferences (20% weight)
    const personalized = await this.getPersonalizedGames(userId, limit, excludeGameIds);
    recommendations.push(
      ...personalized.map((r) => ({ ...r, type: RecommendationType.PERSONALIZED })),
    );

    // Sort by score and deduplicate
    const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
    const sortedRecommendations = uniqueRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Save recommendations
    await this.saveRecommendations(userId, sortedRecommendations, scenario);

    return sortedRecommendations;
  }

  /**
   * Get popular games
   */
  private async getPopularGames(
    limit: number,
    excludeGameIds: string[],
  ): Promise<RecommendationResult[]> {
    const games = await this.gameRepository
      .createQueryBuilder('game')
      .where('game.availability_status = :status', { status: 'available' })
      .andWhere(excludeGameIds.length > 0 ? 'game.id NOT IN (:...excludeIds)' : '1=1', {
        excludeIds: excludeGameIds,
      })
      .orderBy('game.play_count', 'DESC')
      .addOrderBy('game.average_rating', 'DESC')
      .limit(limit)
      .getMany();

    return games.map((game, index) => ({
      game_id: game.id,
      score: 80 - index * 2, // Decreasing score
      reason: `热门游戏 #${index + 1}`,
      type: 'popular' as RecommendationType,
    }));
  }

  /**
   * Get similar games based on user's play history
   */
  private async getSimilarGames(
    playHistory: Array<{ gameId: string; categoryTags: string[] }>,
    limit: number,
    excludeGameIds: string[],
  ): Promise<RecommendationResult[]> {
    // Extract categories from play history
    const categoryMap = new Map<string, number>();
    playHistory.forEach(({ categoryTags }) => {
      categoryTags.forEach((tag) => {
        categoryMap.set(tag, (categoryMap.get(tag) || 0) + 1);
      });
    });

    // Sort categories by frequency
    const topCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    if (topCategories.length === 0) {
      return [];
    }

    // Find games with similar categories
    const games = await this.gameRepository
      .createQueryBuilder('game')
      .where('game.availability_status = :status', { status: 'available' })
      .andWhere(excludeGameIds.length > 0 ? 'game.id NOT IN (:...excludeIds)' : '1=1', {
        excludeIds: excludeGameIds,
      })
      .limit(limit * 2)
      .getMany();

    // Calculate similarity score
    const recommendations = games
      .map((game) => {
        const gameTags = game.categoryTags || [];
        const matchingTags = gameTags.filter((tag) => topCategories.includes(tag));
        const score = (matchingTags.length / topCategories.length) * 100;

        return {
          game_id: game.id,
          score: score * 0.9, // Apply weight
          reason: matchingTags.length > 0 ? `与您喜欢的"${matchingTags[0]}"类似` : '推荐给您',
          type: 'similar' as RecommendationType,
        };
      })
      .filter((r) => r.score > 20) // Only return if similarity > 20%
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return recommendations;
  }

  /**
   * Get trending games (recent popular)
   */
  private async getTrendingGames(
    limit: number,
    excludeGameIds: string[],
  ): Promise<RecommendationResult[]> {
    // Get games with recent high activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingGames = await this.gameSessionRepository
      .createQueryBuilder('session')
      .select('session.game_id', 'game_id')
      .addSelect('COUNT(*)', 'session_count')
      .where('session.created_at >= :since', { since: sevenDaysAgo })
      .andWhere(excludeGameIds.length > 0 ? 'session.game_id NOT IN (:...excludeIds)' : '1=1', {
        excludeIds: excludeGameIds,
      })
      .groupBy('session.game_id')
      .orderBy('session_count', 'DESC')
      .limit(limit)
      .getRawMany();

    return trendingGames.map((item, index) => ({
      game_id: item.game_id,
      score: 75 - index * 3,
      reason: '最近热门',
      type: 'trending' as RecommendationType,
    }));
  }

  /**
   * Get personalized games based on user preferences
   */
  private async getPersonalizedGames(
    userId: string,
    limit: number,
    excludeGameIds: string[],
  ): Promise<RecommendationResult[]> {
    // Get user's favorite game characteristics
    const sessions = await this.gameSessionRepository.find({
      where: { userId },
      order: { durationSeconds: 'DESC' },
      take: 10,
    });

    if (sessions.length === 0) {
      return [];
    }

    // Get games user played most
    const gameIds = sessions.map((s) => s.gameId);
    const gamesPlayed = await this.gameRepository.findBy({ id: In(gameIds) });

    // Calculate average play duration preference
    const avgDuration = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / sessions.length;

    // Find similar games
    const games = await this.gameRepository
      .createQueryBuilder('game')
      .where('game.availability_status = :status', { status: 'available' })
      .andWhere(excludeGameIds.length > 0 ? 'game.id NOT IN (:...excludeIds)' : '1=1', {
        excludeIds: excludeGameIds,
      })
      .limit(limit)
      .getMany();

    return games.slice(0, limit).map((game, index) => ({
      game_id: game.id,
      score: 70 - index * 2,
      reason: '根据您的游玩习惯推荐',
      type: 'personalized' as RecommendationType,
    }));
  }

  /**
   * Get user's play history
   */
  private async getUserPlayHistory(
    userId: string,
  ): Promise<Array<{ gameId: string; categoryTags: string[] }>> {
    const sessions = await this.gameSessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const gameIds = [...new Set(sessions.map((s) => s.gameId))];
    const games = await this.gameRepository.findBy({ id: In(gameIds) });

    return games.map((game) => ({
      gameId: game.id,
      categoryTags: game.categoryTags || [],
    }));
  }

  /**
   * Deduplicate recommendations
   */
  private deduplicateRecommendations(
    recommendations: RecommendationResult[],
  ): RecommendationResult[] {
    const seen = new Map<string, RecommendationResult>();

    recommendations.forEach((rec) => {
      if (!seen.has(rec.game_id) || seen.get(rec.game_id)!.score < rec.score) {
        seen.set(rec.game_id, rec);
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Save recommendations to database
   */
  private async saveRecommendations(
    userId: string,
    recommendations: RecommendationResult[],
    scenario: RecommendationScenario,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

    const entities = recommendations.map((rec) =>
      this.recommendationRepository.create({
        userId,
        gameId: rec.game_id,
        recommendationType: rec.type,
        scenario,
        score: rec.score,
        reason: rec.reason,
        expiresAt,
        metadata: {},
      }),
    );

    await this.recommendationRepository.save(entities);
  }

  /**
   * Track recommendation click
   */
  async trackClick(recommendationId: string): Promise<void> {
    await this.recommendationRepository.update(
      { id: recommendationId },
      { clicked: true },
    );
  }

  /**
   * Track recommendation play
   */
  async trackPlay(userId: string, gameId: string): Promise<void> {
    await this.recommendationRepository.update(
      { userId, gameId, played: false },
      { played: true, clicked: true },
    );
  }
}

