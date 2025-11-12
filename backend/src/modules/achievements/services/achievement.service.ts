/**
 * Achievement Service (User Story 8)
 * T207: Implement AchievementService with milestone tracking
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement, UserAchievement } from '../entities/achievement.entity';

export interface UserAchievementStats {
  total: number;
  unlocked: number;
  locked: number;
  points_earned: number;
  completion_percentage: number;
}

export interface AchievementProgress {
  achievement: Achievement;
  unlocked: boolean;
  progress: number;
  unlocked_at?: Date;
}

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
  ) {}

  /**
   * Get all achievements
   */
  async getAllAchievements(includeHidden: boolean = false): Promise<Achievement[]> {
    const query: any = {};
    
    if (!includeHidden) {
      query.is_hidden = false;
    }

    return this.achievementRepository.find({
      where: query,
      order: { display_order: 'ASC', id: 'ASC' },
    });
  }

  /**
   * Get achievement by ID
   */
  async getAchievementById(id: number): Promise<Achievement> {
    const achievement = await this.achievementRepository.findOne({
      where: { id },
    });

    if (!achievement) {
      throw new NotFoundException(`Achievement with ID ${id} not found`);
    }

    return achievement;
  }

  /**
   * Get achievements by category
   */
  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    return this.achievementRepository.find({
      where: { category, is_hidden: false },
      order: { display_order: 'ASC' },
    });
  }

  /**
   * Get user achievements with unlock status and progress
   */
  async getUserAchievements(userId: number): Promise<{
    achievements: AchievementProgress[];
    stats: UserAchievementStats;
  }> {
    // Get all achievements
    const allAchievements = await this.getAllAchievements();

    // Get user's unlocked achievements
    const userAchievements = await this.userAchievementRepository.find({
      where: { user_id: userId },
    });

    // Create a map for quick lookup
    const unlockedMap = new Map<number, UserAchievement>();
    userAchievements.forEach((ua) => {
      unlockedMap.set(ua.achievement_id, ua);
    });

    // Combine achievements with unlock status
    const achievementsWithStatus: AchievementProgress[] = allAchievements.map((achievement) => {
      const userAchievement = unlockedMap.get(achievement.id);
      
      return {
        achievement,
        unlocked: !!userAchievement,
        progress: userAchievement?.progress || 0,
        unlocked_at: userAchievement?.unlocked_at,
      };
    });

    // Calculate stats
    const unlocked = achievementsWithStatus.filter((a) => a.unlocked).length;
    const total = achievementsWithStatus.length;
    const pointsEarned = achievementsWithStatus
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.achievement.points_reward, 0);

    const stats: UserAchievementStats = {
      total,
      unlocked,
      locked: total - unlocked,
      points_earned: pointsEarned,
      completion_percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
    };

    return {
      achievements: achievementsWithStatus,
      stats,
    };
  }

  /**
   * Check if achievement should be unlocked based on user stats
   */
  async checkAchievementProgress(
    achievementId: number,
    triggerType: string,
    userStats: any,
  ): Promise<{ shouldUnlock: boolean; achievement: Achievement }> {
    const achievement = await this.getAchievementById(achievementId);

    if (achievement.trigger_type !== triggerType) {
      return { shouldUnlock: false, achievement };
    }

    const currentValue = userStats[triggerType] || 0;
    const shouldUnlock = currentValue >= achievement.trigger_threshold;

    return { shouldUnlock, achievement };
  }

  /**
   * Unlock achievement for user
   */
  async unlockAchievement(
    userId: number,
    achievementId: number,
    metadata?: any,
  ): Promise<{ unlocked: boolean; achievement: Achievement; reward_points: number }> {
    // Check if already unlocked
    const existing = await this.userAchievementRepository.findOne({
      where: {
        user_id: userId,
        achievement_id: achievementId,
      },
    });

    if (existing) {
      throw new ConflictException('Achievement already unlocked');
    }

    // Get achievement details
    const achievement = await this.getAchievementById(achievementId);

    // Create user achievement record
    const userAchievement = this.userAchievementRepository.create({
      user_id: userId,
      achievement_id: achievementId,
      progress: 100,
      unlocked_at: new Date(),
      metadata: metadata || {},
    });

    await this.userAchievementRepository.save(userAchievement);

    return {
      unlocked: true,
      achievement,
      reward_points: achievement.points_reward,
    };
  }

  /**
   * Update achievement progress for user
   */
  async updateAchievementProgress(
    userId: number,
    achievementId: number,
    progress: number,
  ): Promise<void> {
    let userAchievement = await this.userAchievementRepository.findOne({
      where: {
        user_id: userId,
        achievement_id: achievementId,
      },
    });

    if (!userAchievement) {
      // Create new progress record
      userAchievement = this.userAchievementRepository.create({
        user_id: userId,
        achievement_id: achievementId,
        progress: Math.min(progress, 100),
      });
    } else {
      // Update existing progress
      userAchievement.progress = Math.min(progress, 100);
    }

    await this.userAchievementRepository.save(userAchievement);
  }

  /**
   * Check and unlock achievements based on user activity
   */
  async checkAndUnlockAchievements(
    userId: number,
    triggerType: string,
    currentValue: number,
  ): Promise<Achievement[]> {
    // Get all achievements with this trigger type
    const achievements = await this.achievementRepository.find({
      where: { trigger_type: triggerType },
    });

    // Get user's unlocked achievements
    const userAchievements = await this.userAchievementRepository.find({
      where: { user_id: userId },
    });

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));

    // Find achievements that should be unlocked
    const toUnlock: Achievement[] = [];

    for (const achievement of achievements) {
      // Skip if already unlocked
      if (unlockedIds.has(achievement.id)) {
        continue;
      }

      // Check if threshold is met
      if (currentValue >= achievement.trigger_threshold) {
        try {
          await this.unlockAchievement(userId, achievement.id);
          toUnlock.push(achievement);
        } catch (error) {
          // Already unlocked or other error, skip
          console.error(`Failed to unlock achievement ${achievement.id}:`, error);
        }
      }
    }

    return toUnlock;
  }

  /**
   * Get recently unlocked achievements for user
   */
  async getRecentlyUnlocked(userId: number, limit: number = 5): Promise<AchievementProgress[]> {
    const userAchievements = await this.userAchievementRepository.find({
      where: { user_id: userId },
      order: { unlocked_at: 'DESC' },
      take: limit,
    });

    const result: AchievementProgress[] = [];

    for (const ua of userAchievements) {
      const achievement = await this.achievementRepository.findOne({
        where: { id: ua.achievement_id },
      });

      if (achievement) {
        result.push({
          achievement,
          unlocked: true,
          progress: 100,
          unlocked_at: ua.unlocked_at,
        });
      }
    }

    return result;
  }

  /**
   * Get achievement statistics by category
   */
  async getStatsByCategory(userId: number): Promise<Map<string, { total: number; unlocked: number }>> {
    const { achievements } = await this.getUserAchievements(userId);

    const stats = new Map<string, { total: number; unlocked: number }>();

    achievements.forEach((item) => {
      const category = item.achievement.category;
      
      if (!stats.has(category)) {
        stats.set(category, { total: 0, unlocked: 0 });
      }

      const categoryStat = stats.get(category)!;
      categoryStat.total++;
      
      if (item.unlocked) {
        categoryStat.unlocked++;
      }
    });

    return stats;
  }
}

