/**
 * Point Calculation Service
 * Handles all point calculation logic
 * T073: Implement point calculation logic based on game session duration
 */

import { Injectable } from '@nestjs/common';

export interface PointRewardRules {
  base_points: number;
  min_duration_seconds: number;
  points_per_minute: number;
  max_points_per_session: number;
}

@Injectable()
export class PointCalculationService {
  /**
   * Calculate points for game session
   */
  calculateGameSessionPoints(
    durationSeconds: number,
    rules: PointRewardRules,
    membershipMultiplier: number = 1.0,
  ): number {
    // No points if duration below minimum
    if (durationSeconds < rules.min_duration_seconds) {
      return 0;
    }

    // Calculate base points + duration-based points
    let points = rules.base_points;
    const minutes = Math.floor(durationSeconds / 60);
    points += minutes * rules.points_per_minute;

    // Apply membership multiplier
    points = Math.floor(points * membershipMultiplier);

    // Cap at maximum
    return Math.min(points, rules.max_points_per_session);
  }

  /**
   * Calculate daily check-in points with consecutive day bonus
   */
  calculateDailyCheckInPoints(consecutiveDays: number = 0): number {
    const basePoints = 10;
    
    if (consecutiveDays <= 0) {
      return basePoints;
    }

    // Bonus for consecutive days (max 30 days)
    const bonus = Math.min(consecutiveDays, 30) * 0.5;
    return Math.floor(basePoints + bonus);
  }

  /**
   * Calculate ad watch points
   */
  calculateAdWatchPoints(adType: string = 'video'): number {
    const adRewards: Record<string, number> = {
      video: 5,
      banner: 2,
      interstitial: 3,
    };

    return adRewards[adType] || 5;
  }

  /**
   * Calculate invitation points
   */
  calculateInvitationPoints(milestone: string): number {
    const milestoneRewards: Record<string, number> = {
      registration: 50,
      first_game: 100,
      first_redemption: 150,
    };

    return milestoneRewards[milestone] || 0;
  }

  /**
   * Validate point amount
   */
  validatePointAmount(amount: number): void {
    if (amount < 0) {
      throw new Error('Point amount cannot be negative');
    }

    if (amount > 100000) {
      throw new Error('Point amount exceeds maximum limit');
    }
  }

  /**
   * Calculate new balance
   */
  calculateNewBalance(currentBalance: number, change: number): number {
    const newBalance = currentBalance + change;

    if (newBalance < 0) {
      throw new Error('Insufficient points balance');
    }

    return newBalance;
  }

  /**
   * Check if points are expired (1 year expiration)
   */
  isPointsExpired(earnedDate: Date): boolean {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return earnedDate < oneYearAgo;
  }
}
