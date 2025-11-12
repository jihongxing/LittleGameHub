/**
 * Unit tests for Point Calculation Logic
 * User Story 2: Earn and Manage Points
 * T065: Unit test for point calculation logic
 */

import { PointCalculationService } from '../../src/modules/points/services/point-calculation.service';

describe('PointCalculationService (T065)', () => {
  let service: PointCalculationService;

  beforeEach(() => {
    service = new PointCalculationService();
  });

  describe('Game Session Points Calculation', () => {
    it('should calculate points correctly for valid duration', () => {
      const pointRules = {
        base_points: 10,
        min_duration_seconds: 180, // 3 minutes
        points_per_minute: 5,
        max_points_per_session: 100,
      };

      // 5 minutes = 300 seconds
      const points = service.calculateGameSessionPoints(300, pointRules);

      // base_points + (5 minutes * points_per_minute) = 10 + (5 * 5) = 35
      expect(points).toBe(35);
    });

    it('should return 0 points if duration below minimum', () => {
      const pointRules = {
        base_points: 10,
        min_duration_seconds: 180,
        points_per_minute: 5,
        max_points_per_session: 100,
      };

      // 2 minutes = 120 seconds (below minimum)
      const points = service.calculateGameSessionPoints(120, pointRules);
      expect(points).toBe(0);
    });

    it('should cap points at maximum', () => {
      const pointRules = {
        base_points: 10,
        min_duration_seconds: 180,
        points_per_minute: 5,
        max_points_per_session: 100,
      };

      // 30 minutes = 1800 seconds
      // Would be: 10 + (30 * 5) = 160, but capped at 100
      const points = service.calculateGameSessionPoints(1800, pointRules);
      expect(points).toBe(100);
    });

    it('should apply membership multiplier correctly', () => {
      const pointRules = {
        base_points: 10,
        min_duration_seconds: 180,
        points_per_minute: 5,
        max_points_per_session: 200,
      };

      const membershipMultiplier = 1.3; // 30% bonus
      const points = service.calculateGameSessionPoints(300, pointRules, membershipMultiplier);

      // (10 + (5 * 5)) * 1.3 = 35 * 1.3 = 45.5, floored to 45
      expect(points).toBe(45);
    });

    it('should handle zero base points', () => {
      const pointRules = {
        base_points: 0,
        min_duration_seconds: 180,
        points_per_minute: 5,
        max_points_per_session: 100,
      };

      const points = service.calculateGameSessionPoints(300, pointRules);
      expect(points).toBe(25); // 0 + (5 * 5) = 25
    });

    it('should round down partial points', () => {
      const pointRules = {
        base_points: 10,
        min_duration_seconds: 60,
        points_per_minute: 3,
        max_points_per_session: 100,
      };

      // 90 seconds = 1.5 minutes, should floor to 1 minute
      const points = service.calculateGameSessionPoints(90, pointRules);
      expect(points).toBe(13); // 10 + (1 * 3) = 13
    });
  });

  describe('Daily Check-in Points', () => {
    it('should return base points for daily check-in', () => {
      const points = service.calculateDailyCheckInPoints();
      expect(points).toBeGreaterThan(0);
      expect(points).toBe(10); // Default daily check-in reward
    });

    it('should apply consecutive day bonus', () => {
      const consecutiveDays = 7;
      const points = service.calculateDailyCheckInPoints(consecutiveDays);
      
      // Base 10 + bonus for 7 days
      expect(points).toBeGreaterThan(10);
    });

    it('should cap consecutive day bonus', () => {
      const points30Days = service.calculateDailyCheckInPoints(30);
      const points100Days = service.calculateDailyCheckInPoints(100);
      
      // Should have a maximum bonus cap
      expect(points100Days).toBeLessThanOrEqual(points30Days * 1.5);
    });
  });

  describe('Ad Watch Points', () => {
    it('should calculate ad watch points', () => {
      const points = service.calculateAdWatchPoints();
      expect(points).toBeGreaterThan(0);
    });

    it('should have different points for different ad types', () => {
      const videoPoints = service.calculateAdWatchPoints('video');
      const bannerPoints = service.calculateAdWatchPoints('banner');
      
      expect(videoPoints).toBeGreaterThan(bannerPoints);
    });
  });

  describe('Invitation Points', () => {
    it('should calculate points for successful invitation', () => {
      const points = service.calculateInvitationPoints('registration');
      expect(points).toBeGreaterThan(0);
    });

    it('should have different rewards for different milestones', () => {
      const registrationPoints = service.calculateInvitationPoints('registration');
      const firstGamePoints = service.calculateInvitationPoints('first_game');
      const firstRedemptionPoints = service.calculateInvitationPoints('first_redemption');
      
      expect(registrationPoints).toBeGreaterThan(0);
      expect(firstGamePoints).toBeGreaterThan(registrationPoints);
      expect(firstRedemptionPoints).toBeGreaterThan(firstGamePoints);
    });
  });

  describe('Point Transaction Validation', () => {
    it('should validate point amounts are non-negative', () => {
      expect(() => service.validatePointAmount(-10)).toThrow();
    });

    it('should validate point amounts are reasonable', () => {
      expect(() => service.validatePointAmount(1000000)).toThrow();
    });

    it('should accept valid point amounts', () => {
      expect(() => service.validatePointAmount(100)).not.toThrow();
    });
  });

  describe('Balance Calculations', () => {
    it('should calculate new balance after earning', () => {
      const currentBalance = 100;
      const pointsEarned = 50;
      
      const newBalance = service.calculateNewBalance(currentBalance, pointsEarned);
      expect(newBalance).toBe(150);
    });

    it('should calculate new balance after spending', () => {
      const currentBalance = 100;
      const pointsSpent = 30;
      
      const newBalance = service.calculateNewBalance(currentBalance, -pointsSpent);
      expect(newBalance).toBe(70);
    });

    it('should not allow negative balance', () => {
      const currentBalance = 50;
      const pointsSpent = 100;
      
      expect(() => 
        service.calculateNewBalance(currentBalance, -pointsSpent)
      ).toThrow();
    });
  });

  describe('Point Expiration', () => {
    it('should check if points are expired', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const isExpired = service.isPointsExpired(oneYearAgo);
      expect(isExpired).toBe(true);
    });

    it('should not expire recent points', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const isExpired = service.isPointsExpired(yesterday);
      expect(isExpired).toBe(false);
    });
  });
});

