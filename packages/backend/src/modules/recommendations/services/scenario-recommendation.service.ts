/**
 * Scenario Recommendation Service
 * Implements scenario-based recommendation logic
 * T143: Implement scenario-based recommendation logic (commute, break_time, bedtime)
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Game, GameAvailabilityStatus } from '../../games/entities/game.entity';
import { RecommendationScenario } from '../entities/recommendation.entity';

export interface ScenarioConfig {
  scenario: RecommendationScenario;
  maxDuration: number; // seconds
  categories: string[];
  description: string;
}

@Injectable()
export class ScenarioRecommendationService {
  private readonly logger = new Logger(ScenarioRecommendationService.name);

  // Scenario configurations
  private readonly SCENARIOS: ScenarioConfig[] = [
    {
      scenario: RecommendationScenario.COMMUTE,
      maxDuration: 900, // 15 minutes
      categories: [
        // 中文分类
        '休闲', '益智', '解谜', '快节奏',
        // 英文分类
        'Casual', 'Puzzle', 'Arcade', 'Quick', 'Fast-Paced', 'Short', 'Mobile'
      ],
      description: '通勤时间适合快节奏、轻松的游戏',
    },
    {
      scenario: RecommendationScenario.BREAK_TIME,
      maxDuration: 600, // 10 minutes
      categories: [
        // 中文分类
        '休闲', '益智', '街机',
        // 英文分类
        'Casual', 'Puzzle', 'Arcade', 'Relaxing', 'Simple', 'Quick'
      ],
      description: '休息时间适合轻松休闲的游戏',
    },
    {
      scenario: RecommendationScenario.BEDTIME,
      maxDuration: 1800, // 30 minutes
      categories: [
        // 中文分类
        '休闲', '放松', '解谜', '冒险',
        // 英文分类
        'Relaxing', 'Atmospheric', 'Calm', 'Peaceful', 'Adventure', 'Story', 'Singleplayer'
      ],
      description: '睡前适合放松、舒缓的游戏',
    },
    {
      scenario: RecommendationScenario.WEEKEND,
      maxDuration: 7200, // 2 hours
      categories: [
        // 中文分类
        '冒险', '角色扮演', '策略', '竞技',
        // 英文分类
        'Adventure', 'RPG', 'Strategy', 'Open World', 'Story Rich', 'Immersive', 'Complex'
      ],
      description: '周末适合深度体验的游戏',
    },
    {
      scenario: RecommendationScenario.ANY,
      maxDuration: 3600, // 1 hour
      categories: [
        // 中文分类
        '休闲', '益智', '动作', '冒险', '策略', '模拟', '体育', '竞速',
        // 英文分类
        'Action', 'Adventure', 'Puzzle', 'Strategy', 'Simulation', 'Sports', 'Racing', 'Casual',
        'RPG', 'Singleplayer', 'Atmospheric', 'Open World', 'First-Person', 'Third-Person',
        'Arcade', 'Platformer', 'Shooter', 'Fighting', 'Horror', 'Survival'
      ],
      description: '适合任何时间的游戏',
    },
  ];

  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  /**
   * Get recommendations for specific scenario
   */
  async getScenarioRecommendations(
    scenario: RecommendationScenario,
    options: {
      limit?: number;
      excludeGameIds?: string[];
    } = {},
  ): Promise<Array<{ game_id: string; score: number; reason: string }>> {
    const { limit = 10, excludeGameIds = [] } = options;

    // Get scenario config
    const config = this.SCENARIOS.find((s) => s.scenario === scenario);
    if (!config) {
      this.logger.warn(`Unknown scenario: ${scenario}`);
      return [];
    }

    // Find games matching scenario criteria
    const games = await this.gameRepository
      .createQueryBuilder('game')
      .where('game.availability_status = :status', { status: GameAvailabilityStatus.ACTIVE })
      .andWhere('game.min_play_duration_seconds <= :maxDuration', {
        maxDuration: config.maxDuration,
      })
      .andWhere(excludeGameIds.length > 0 ? 'game.id NOT IN (:...excludeIds)' : '1=1', {
        excludeIds: excludeGameIds,
      })
      .orderBy('game.average_rating', 'DESC')
      .addOrderBy('game.play_count', 'DESC')
      .limit(limit * 2)
      .getMany();

    // Score games based on scenario fit
    const recommendations = games
      .map((game) => {
        const score = this.calculateScenarioScore(game, config);
        return {
          game_id: game.id,
          score,
          reason: this.generateScenarioReason(game, config),
        };
      })
      .filter((r) => r.score > 20) // Only return games with decent fit
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return recommendations;
  }

  /**
   * Calculate how well a game fits a scenario
   */
  private calculateScenarioScore(game: Game, config: ScenarioConfig): number {
    let score = 50; // Base score

    // Duration fit (30 points max)
    const durationRatio = game.minPlayDurationSeconds / config.maxDuration;
    if (durationRatio <= 0.5) {
      score += 30; // Perfect fit
    } else if (durationRatio <= 0.8) {
      score += 20; // Good fit
    } else if (durationRatio <= 1.0) {
      score += 10; // Acceptable fit
    }

    // Category match (30 points max)
    const gameTags = game.categoryTags || [];
    const matchingCategories = gameTags.filter((tag) =>
      config.categories.some((cat) => {
        const tagLower = tag.toLowerCase();
        const catLower = cat.toLowerCase();
        // 精确匹配或包含匹配
        return tagLower === catLower || 
               tagLower.includes(catLower) || 
               catLower.includes(tagLower);
      }),
    );
    
    // 计算分类匹配分数
    if (matchingCategories.length === 0) {
      score += 5; // 新游戏基础分数
    } else {
      // 根据匹配数量给分，最多30分
      const matchRatio = Math.min(matchingCategories.length / 3, 1); // 最多3个匹配就给满分
      score += matchRatio * 30;
      
      // 记录匹配的分类用于调试
      this.logger.debug(`Game "${game.title}" matched categories: ${matchingCategories.join(', ')}`);
    }

    // Rating bonus (20 points max) - 如果没有评分，给新游戏一些基础分数
    if (game.averageRating && game.averageRating > 0) {
      score += (game.averageRating / 5) * 20;
    } else {
      score += 10; // 新游戏基础评分分数
    }

    // Popularity bonus (20 points max) - 如果没有游玩次数，给新游戏一些基础分数
    if (game.playCount > 0) {
      const popularityScore = Math.min((game.playCount / 1000) * 20, 20);
      score += popularityScore;
    } else {
      score += 5; // 新游戏基础热度分数
    }

    return Math.min(score, 100);
  }

  /**
   * Generate reason text for scenario recommendation
   */
  private generateScenarioReason(game: Game, config: ScenarioConfig): string {
    const reasons: string[] = [];

    // Duration reason
    const minutes = Math.ceil(game.minPlayDurationSeconds / 60);
    reasons.push(`${minutes}分钟快速体验`);

    // Category reason
    const gameTags = game.categoryTags || [];
    const matchingCategories = gameTags.filter((tag) =>
      config.categories.some((cat) => tag.includes(cat) || cat.includes(tag)),
    );
    if (matchingCategories.length > 0) {
      reasons.push(matchingCategories[0]);
    }

    // Rating reason
    if ((game.averageRating || 0) >= 4.5) {
      reasons.push('高评分');
    }

    return reasons.join(' · ');
  }

  /**
   * Detect current scenario based on time
   */
  detectCurrentScenario(): RecommendationScenario {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Weekend
    if (day === 0 || day === 6) {
      return RecommendationScenario.WEEKEND;
    }

    // Bedtime (22:00 - 01:00)
    if (hour >= 22 || hour <= 1) {
      return RecommendationScenario.BEDTIME;
    }

    // Commute time (07:00 - 09:00, 17:00 - 19:00)
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return RecommendationScenario.COMMUTE;
    }

    // Break time (12:00 - 14:00)
    if (hour >= 12 && hour <= 14) {
      return RecommendationScenario.BREAK_TIME;
    }

    // Default
    return RecommendationScenario.ANY;
  }

  /**
   * Get all available scenarios
   */
  getAvailableScenarios(): ScenarioConfig[] {
    return this.SCENARIOS;
  }

  /**
   * Get scenario config
   */
  getScenarioConfig(scenario: RecommendationScenario): ScenarioConfig | null {
    return this.SCENARIOS.find((s) => s.scenario === scenario) || null;
  }
}

