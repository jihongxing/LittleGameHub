/**
 * Achievements Page Component Tests (User Story 8)
 * T204: Component test for Achievements page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AchievementsPage from '@/pages/Profile/AchievementsPage';
import * as achievementsApi from '@/services/api/achievements';

// Mock the API
vi.mock('@/services/api/achievements');

const mockAchievements = [
  {
    id: 1,
    title: 'First Game',
    description: 'Play your first game',
    category: 'gameplay',
    points_reward: 10,
    icon_url: 'icon1.png',
    rarity: 'common',
    unlocked: true,
    unlocked_at: '2024-01-01T00:00:00Z',
    progress: 100,
  },
  {
    id: 2,
    title: 'Game Master',
    description: 'Play 100 games',
    category: 'gameplay',
    points_reward: 100,
    icon_url: 'icon2.png',
    rarity: 'epic',
    unlocked: false,
    progress: 50,
  },
];

const mockStats = {
  total: 10,
  unlocked: 5,
  locked: 5,
  points_earned: 150,
};

describe('AchievementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render achievements page', async () => {
    (achievementsApi.getUserAchievements as any).mockResolvedValue({
      achievements: mockAchievements,
      stats: mockStats,
    });

    render(
      <BrowserRouter>
        <AchievementsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('我的成就')).toBeInTheDocument();
    });
  });

  it('should display achievement stats', async () => {
    (achievementsApi.getUserAchievements as any).mockResolvedValue({
      achievements: mockAchievements,
      stats: mockStats,
    });

    render(
      <BrowserRouter>
        <AchievementsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/总成就/)).toBeInTheDocument();
      expect(screen.getByText(/已解锁/)).toBeInTheDocument();
      expect(screen.getByText(/未解锁/)).toBeInTheDocument();
    });
  });

  it('should display achievement cards', async () => {
    (achievementsApi.getUserAchievements as any).mockResolvedValue({
      achievements: mockAchievements,
      stats: mockStats,
    });

    render(
      <BrowserRouter>
        <AchievementsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('First Game')).toBeInTheDocument();
      expect(screen.getByText('Game Master')).toBeInTheDocument();
    });
  });

  it('should show unlocked status for completed achievements', async () => {
    (achievementsApi.getUserAchievements as any).mockResolvedValue({
      achievements: mockAchievements,
      stats: mockStats,
    });

    render(
      <BrowserRouter>
        <AchievementsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const unlockedBadges = screen.getAllByText(/已解锁/);
      expect(unlockedBadges.length).toBeGreaterThan(0);
    });
  });

  it('should show progress for locked achievements', async () => {
    (achievementsApi.getUserAchievements as any).mockResolvedValue({
      achievements: mockAchievements,
      stats: mockStats,
    });

    render(
      <BrowserRouter>
        <AchievementsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
  });

  it('should filter achievements by category', async () => {
    (achievementsApi.getUserAchievements as any).mockResolvedValue({
      achievements: mockAchievements,
      stats: mockStats,
    });

    render(
      <BrowserRouter>
        <AchievementsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/全部/)).toBeInTheDocument();
      expect(screen.getByText(/游戏/)).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    (achievementsApi.getUserAchievements as any).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(
      <BrowserRouter>
        <AchievementsPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    (achievementsApi.getUserAchievements as any).mockRejectedValue(
      new Error('Failed to load'),
    );

    render(
      <BrowserRouter>
        <AchievementsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/加载失败/)).toBeInTheDocument();
    });
  });

  it('should display empty state when no achievements', async () => {
    (achievementsApi.getUserAchievements as any).mockResolvedValue({
      achievements: [],
      stats: { total: 0, unlocked: 0, locked: 0, points_earned: 0 },
    });

    render(
      <BrowserRouter>
        <AchievementsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/暂无成就/)).toBeInTheDocument();
    });
  });
});

