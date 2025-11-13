/**
 * User Growth Service (User Story 8)
 * T209: Implement user level and experience system
 */

import { Injectable } from '@nestjs/common';

export interface UserLevel {
  level: number;
  currentExp: number;
  expForNextLevel: number;
  totalExp: number;
  progress: number; // Percentage to next level
}

export interface LevelUpReward {
  level: number;
  points: number;
  unlocks: string[];
}

@Injectable()
export class UserGrowthService {
  private readonly BASE_EXP = 100;
  private readonly EXP_MULTIPLIER = 1.5;

  /**
   * Calculate user level from total experience
   */
  calculateLevel(totalExp: number): UserLevel {
    let level = 1;
    let expNeeded = 0;
    let previousExpNeeded = 0;

    while (expNeeded <= totalExp) {
      level++;
      previousExpNeeded = expNeeded;
      expNeeded += this.getExpForLevel(level);
    }

    level--; // Go back to the actual level
    const currentExp = totalExp - previousExpNeeded;
    const expForNextLevel = this.getExpForLevel(level + 1);
    const progress = Math.round((currentExp / expForNextLevel) * 100);

    return {
      level,
      currentExp,
      expForNextLevel,
      totalExp,
      progress,
    };
  }

  /**
   * Get experience points required for a specific level
   */
  getExpForLevel(level: number): number {
    return Math.floor(this.BASE_EXP * Math.pow(this.EXP_MULTIPLIER, level - 1));
  }

  /**
   * Calculate experience gained from various activities
   */
  calculateExpGain(activityType: string, metadata?: any): number {
    const expValues: { [key: string]: number } = {
      game_played: 10,
      game_completed: 25,
      achievement_unlocked: 50,
      daily_login: 5,
      friend_added: 15,
      collection_created: 20,
      game_downloaded: 30,
      challenge_won: 40,
      points_milestone: 100,
    };

    let baseExp = expValues[activityType] || 0;

    // Apply multipliers based on metadata
    if (metadata) {
      if (metadata.difficulty && metadata.difficulty === 'hard') {
        baseExp *= 1.5;
      }
      
      if (metadata.score && metadata.score > 1000) {
        baseExp *= 1.2;
      }

      if (metadata.isMember) {
        baseExp *= 1.25;
      }
    }

    return Math.floor(baseExp);
  }

  /**
   * Add experience to user and check for level up
   */
  async addExperience(
    userId: number,
    activityType: string,
    metadata?: any,
  ): Promise<{
    expGained: number;
    leveledUp: boolean;
    oldLevel: number;
    newLevel: number;
    reward?: LevelUpReward;
  }> {
    // Calculate EXP gain
    const expGained = this.calculateExpGain(activityType, metadata);

    // Get user's current total EXP (would be from database)
    const currentTotalExp = await this.getUserTotalExp(userId);
    const oldLevelInfo = this.calculateLevel(currentTotalExp);

    // Add new EXP
    const newTotalExp = currentTotalExp + expGained;
    const newLevelInfo = this.calculateLevel(newTotalExp);

    // Check for level up
    const leveledUp = newLevelInfo.level > oldLevelInfo.level;
    let reward: LevelUpReward | undefined;

    if (leveledUp) {
      reward = this.getLevelUpReward(newLevelInfo.level);
      // Award level up rewards (would update database)
      await this.awardLevelUpReward(userId, reward);
    }

    // Update user's total EXP (would update database)
    await this.updateUserTotalExp(userId, newTotalExp);

    return {
      expGained,
      leveledUp,
      oldLevel: oldLevelInfo.level,
      newLevel: newLevelInfo.level,
      reward,
    };
  }

  /**
   * Get level up reward for a specific level
   */
  getLevelUpReward(level: number): LevelUpReward {
    const basePoints = 100;
    const points = basePoints * level;

    const unlocks: string[] = [];

    // Add special unlocks at certain levels
    if (level === 5) {
      unlocks.push('特殊头像框');
    }
    
    if (level === 10) {
      unlocks.push('自定义主题');
      unlocks.push('专属徽章');
    }

    if (level === 20) {
      unlocks.push('高级统计');
    }

    if (level === 50) {
      unlocks.push('传奇头衔');
    }

    return {
      level,
      points,
      unlocks,
    };
  }

  /**
   * Get user's ranking tier based on level
   */
  getUserTier(level: number): {
    tier: string;
    color: string;
    minLevel: number;
    maxLevel: number;
  } {
    if (level >= 50) {
      return { tier: '传奇', color: '#FFD700', minLevel: 50, maxLevel: 999 };
    }
    if (level >= 30) {
      return { tier: '大师', color: '#C0C0C0', minLevel: 30, maxLevel: 49 };
    }
    if (level >= 20) {
      return { tier: '专家', color: '#CD7F32', minLevel: 20, maxLevel: 29 };
    }
    if (level >= 10) {
      return { tier: '资深', color: '#4169E1', minLevel: 10, maxLevel: 19 };
    }
    if (level >= 5) {
      return { tier: '熟练', color: '#32CD32', minLevel: 5, maxLevel: 9 };
    }
    return { tier: '新手', color: '#808080', minLevel: 1, maxLevel: 4 };
  }

  /**
   * Get leaderboard of top users by level
   */
  async getLeaderboard(limit: number = 10): Promise<Array<{
    userId: number;
    level: number;
    totalExp: number;
    tier: string;
  }>> {
    // This would query the database for top users
    // For now, return placeholder
    return [];
  }

  /**
   * Get user's total experience (would query database)
   */
  private async getUserTotalExp(userId: number): Promise<number> {
    // TODO: Query database for user's total EXP
    // For now, return placeholder
    return 0;
  }

  /**
   * Update user's total experience (would update database)
   */
  private async updateUserTotalExp(userId: number, totalExp: number): Promise<void> {
    // TODO: Update database with new total EXP
    console.log(`User ${userId} total EXP updated to ${totalExp}`);
  }

  /**
   * Award level up reward (would update database)
   */
  private async awardLevelUpReward(userId: number, reward: LevelUpReward): Promise<void> {
    // TODO: Award points and unlocks to user
    console.log(`User ${userId} received level up reward:`, reward);
  }
}

