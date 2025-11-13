/**
 * Achievement Service Unit Tests (User Story 8)
 * T203: Unit test for achievement unlocking logic
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AchievementService } from '../../src/modules/achievements/services/achievement.service';
import { Achievement } from '../../src/modules/achievements/entities/achievement.entity';

describe('AchievementService', () => {
  let service: AchievementService;
  let repository: Repository<Achievement>;

  const mockAchievement = {
    id: 1,
    title: 'First Game',
    description: 'Play your first game',
    category: 'gameplay',
    trigger_type: 'game_play_count',
    trigger_threshold: 1,
    points_reward: 10,
    icon_url: 'icon.png',
    rarity: 'common',
    is_hidden: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementService,
        {
          provide: getRepositoryToken(Achievement),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AchievementService>(AchievementService);
    repository = module.get<Repository<Achievement>>(
      getRepositoryToken(Achievement),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAchievements', () => {
    it('should return all achievements', async () => {
      const achievements = [mockAchievement];
      mockRepository.find.mockResolvedValue(achievements);

      const result = await service.getAllAchievements();

      expect(result).toEqual(achievements);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('getAchievementById', () => {
    it('should return achievement by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockAchievement);

      const result = await service.getAchievementById(1);

      expect(result).toEqual(mockAchievement);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null for non-existent achievement', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getAchievementById(999);

      expect(result).toBeNull();
    });
  });

  describe('checkAchievementProgress', () => {
    it('should detect achievement unlock when threshold is met', async () => {
      const userStats = {
        game_play_count: 1,
        points_earned: 0,
        games_completed: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockAchievement);

      const result = await service.checkAchievementProgress(
        1,
        'game_play_count',
        userStats,
      );

      expect(result.shouldUnlock).toBe(true);
      expect(result.achievement).toEqual(mockAchievement);
    });

    it('should not unlock when threshold is not met', async () => {
      const userStats = {
        game_play_count: 0,
        points_earned: 0,
        games_completed: 0,
      };

      mockRepository.findOne.mockResolvedValue(mockAchievement);

      const result = await service.checkAchievementProgress(
        1,
        'game_play_count',
        userStats,
      );

      expect(result.shouldUnlock).toBe(false);
    });
  });

  describe('unlockAchievement', () => {
    it('should unlock achievement for user', async () => {
      const unlockData = {
        user_id: 1,
        achievement_id: 1,
        unlocked_at: new Date(),
      };

      mockRepository.save.mockResolvedValue(unlockData);

      const result = await service.unlockAchievement(1, 1);

      expect(result).toHaveProperty('unlocked', true);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('getUserAchievements', () => {
    it('should return user achievements with unlock status', async () => {
      const userId = 1;
      const achievements = [
        { ...mockAchievement, unlocked: true, unlocked_at: new Date() },
      ];

      mockRepository.find.mockResolvedValue(achievements);

      const result = await service.getUserAchievements(userId);

      expect(result).toHaveProperty('achievements');
      expect(result).toHaveProperty('stats');
      expect(result.stats).toHaveProperty('total');
      expect(result.stats).toHaveProperty('unlocked');
    });
  });
});

