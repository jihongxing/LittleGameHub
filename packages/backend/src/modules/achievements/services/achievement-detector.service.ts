/**
 * Achievement Detector Service (User Story 8)
 * T208: Implement achievement unlock detection logic
 */

import { Injectable } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { Achievement } from '../entities/achievement.entity';

export interface UserActivity {
  userId: number;
  activityType: string;
  value: number;
  metadata?: any;
}

@Injectable()
export class AchievementDetectorService {
  constructor(private achievementService: AchievementService) {}

  /**
   * Detect and unlock achievements based on user activity
   */
  async detectAndUnlock(activity: UserActivity): Promise<Achievement[]> {
    const { userId, activityType, value } = activity;

    // Map activity types to trigger types
    const triggerType = this.mapActivityToTriggerType(activityType);
    
    if (!triggerType) {
      return [];
    }

    // Check and unlock achievements
    return this.achievementService.checkAndUnlockAchievements(
      userId,
      triggerType,
      value,
    );
  }

  /**
   * Handle game play activity
   */
  async onGamePlayed(userId: number, gamePlayCount: number): Promise<Achievement[]> {
    return this.detectAndUnlock({
      userId,
      activityType: 'game_played',
      value: gamePlayCount,
    });
  }

  /**
   * Handle points earned activity
   */
  async onPointsEarned(userId: number, totalPoints: number): Promise<Achievement[]> {
    return this.detectAndUnlock({
      userId,
      activityType: 'points_earned',
      value: totalPoints,
    });
  }

  /**
   * Handle friend added activity
   */
  async onFriendAdded(userId: number, friendCount: number): Promise<Achievement[]> {
    return this.detectAndUnlock({
      userId,
      activityType: 'friend_added',
      value: friendCount,
    });
  }

  /**
   * Handle collection created activity
   */
  async onCollectionCreated(userId: number, collectionCount: number): Promise<Achievement[]> {
    return this.detectAndUnlock({
      userId,
      activityType: 'collection_created',
      value: collectionCount,
    });
  }

  /**
   * Handle game added to collection activity
   */
  async onGameAddedToCollection(userId: number, gamesInCollections: number): Promise<Achievement[]> {
    return this.detectAndUnlock({
      userId,
      activityType: 'game_in_collection',
      value: gamesInCollections,
    });
  }

  /**
   * Handle membership upgraded activity
   */
  async onMembershipUpgraded(userId: number, membershipTier: number): Promise<Achievement[]> {
    return this.detectAndUnlock({
      userId,
      activityType: 'membership_upgraded',
      value: membershipTier,
    });
  }

  /**
   * Handle login streak activity
   */
  async onLoginStreak(userId: number, streakDays: number): Promise<Achievement[]> {
    return this.detectAndUnlock({
      userId,
      activityType: 'login_streak',
      value: streakDays,
    });
  }

  /**
   * Handle special play time activities
   */
  async onSpecialPlayTime(userId: number, playTime: Date): Promise<Achievement[]> {
    const hour = playTime.getHours();
    const unlockedAchievements: Achievement[] = [];

    // Early bird (0-6 AM)
    if (hour >= 0 && hour < 6) {
      const achievements = await this.detectAndUnlock({
        userId,
        activityType: 'early_bird',
        value: 1,
      });
      unlockedAchievements.push(...achievements);
    }

    // Night owl (2-5 AM)
    if (hour >= 2 && hour < 5) {
      const achievements = await this.detectAndUnlock({
        userId,
        activityType: 'night_owl',
        value: 1,
      });
      unlockedAchievements.push(...achievements);
    }

    return unlockedAchievements;
  }

  /**
   * Batch check multiple activities
   */
  async batchCheckActivities(activities: UserActivity[]): Promise<Map<number, Achievement[]>> {
    const results = new Map<number, Achievement[]>();

    for (const activity of activities) {
      const unlocked = await this.detectAndUnlock(activity);
      
      if (unlocked.length > 0) {
        if (!results.has(activity.userId)) {
          results.set(activity.userId, []);
        }
        results.get(activity.userId)!.push(...unlocked);
      }
    }

    return results;
  }

  /**
   * Get achievement suggestions for user
   */
  async getSuggestedAchievements(userId: number, limit: number = 3): Promise<Achievement[]> {
    const { achievements } = await this.achievementService.getUserAchievements(userId);

    // Find locked achievements with progress
    const inProgress = achievements
      .filter((a) => !a.unlocked && a.progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, limit)
      .map((a) => a.achievement);

    return inProgress;
  }

  /**
   * Map activity type to trigger type
   */
  private mapActivityToTriggerType(activityType: string): string | null {
    const mapping: { [key: string]: string } = {
      game_played: 'game_play_count',
      points_earned: 'points_earned',
      friend_added: 'friends_count',
      collection_created: 'collections_count',
      game_in_collection: 'games_in_collections',
      membership_upgraded: 'membership_tier',
      login_streak: 'login_streak',
      early_bird: 'early_bird_play',
      night_owl: 'night_owl_play',
    };

    return mapping[activityType] || null;
  }
}

