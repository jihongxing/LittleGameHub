/**
 * Component tests for Points Page
 * User Story 2: Earn and Manage Points
 * T066: Component test for Points page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PointsPage from '@/pages/Points/PointsPage';
import * as pointsApi from '@/services/api/points';
import * as rewardsApi from '@/services/api/rewards';

// Mock APIs
vi.mock('@/services/api/points', () => ({
  getPointBalance: vi.fn(),
  getPointTransactions: vi.fn(),
  getPointTasks: vi.fn(),
  completeTask: vi.fn(),
}));

vi.mock('@/services/api/rewards', () => ({
  getRewards: vi.fn(),
  redeemReward: vi.fn(),
}));

describe('PointsPage Component (T066)', () => {
  const mockBalance = {
    balance: 1000,
    pending: 50,
  };

  const mockTasks = [
    {
      id: 'daily_checkin',
      name: 'Daily Check-in',
      description: 'Check in daily to earn points',
      point_reward: 10,
      is_completed: false,
      cooldown_until: null,
    },
    {
      id: 'watch_ad',
      name: 'Watch Ad',
      description: 'Watch an advertisement',
      point_reward: 5,
      is_completed: false,
      cooldown_until: null,
    },
  ];

  const mockTransactions = [
    {
      id: '1',
      type: 'earn',
      amount: 50,
      source: 'game_play',
      description: 'Played game for 5 minutes',
      balance_after: 1050,
      created_at: '2025-11-12T10:00:00Z',
    },
    {
      id: '2',
      type: 'spend',
      amount: -300,
      source: 'redemption',
      description: 'Redeemed: Membership Trial',
      balance_after: 750,
      created_at: '2025-11-11T15:00:00Z',
    },
  ];

  const mockRewards = [
    {
      id: 'reward-1',
      name: 'Membership Trial',
      description: '7-day membership trial',
      point_cost: 300,
      reward_type: 'membership_trial',
      availability_status: 'available',
      stock_quantity: null,
    },
    {
      id: 'reward-2',
      name: 'Gift Card',
      description: '$10 gift card',
      point_cost: 1000,
      reward_type: 'cash',
      availability_status: 'available',
      stock_quantity: 5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pointsApi.getPointBalance).mockResolvedValue(mockBalance);
    vi.mocked(pointsApi.getPointTasks).mockResolvedValue({ tasks: mockTasks });
    vi.mocked(pointsApi.getPointTransactions).mockResolvedValue({
      transactions: mockTransactions,
      pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
    });
    vi.mocked(rewardsApi.getRewards).mockResolvedValue({ rewards: mockRewards });
  });

  it('should render points page with balance', async () => {
    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1000')).toBeInTheDocument();
    });

    expect(screen.getByText(/current balance/i)).toBeInTheDocument();
  });

  it('should display available point tasks', async () => {
    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Daily Check-in')).toBeInTheDocument();
    });

    expect(screen.getByText('Watch Ad')).toBeInTheDocument();
    expect(screen.getAllByText(/10.*points/i)[0]).toBeInTheDocument();
  });

  it('should complete a task when clicked', async () => {
    vi.mocked(pointsApi.completeTask).mockResolvedValue({
      points_earned: 10,
      new_balance: 1010,
      transaction_id: 'tx-123',
    });

    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    const checkInButton = await waitFor(() =>
      screen.getByText(/check in/i)
    );

    fireEvent.click(checkInButton);

    await waitFor(() => {
      expect(pointsApi.completeTask).toHaveBeenCalledWith('daily_checkin');
    });
  });

  it('should show completed tasks as disabled', async () => {
    const completedTasks = [
      {
        ...mockTasks[0],
        is_completed: true,
      },
    ];

    vi.mocked(pointsApi.getPointTasks).mockResolvedValue({ tasks: completedTasks });

    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    const checkInButton = await waitFor(() =>
      screen.getByText(/completed/i)
    );

    expect(checkInButton).toBeDisabled();
  });

  it('should display transaction history', async () => {
    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Played game for 5 minutes/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Redeemed: Membership Trial/i)).toBeInTheDocument();
    expect(screen.getByText('+50')).toBeInTheDocument();
    expect(screen.getByText('-300')).toBeInTheDocument();
  });

  it('should display available rewards', async () => {
    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Membership Trial')).toBeInTheDocument();
    });

    expect(screen.getByText('Gift Card')).toBeInTheDocument();
    expect(screen.getByText('300 points')).toBeInTheDocument();
    expect(screen.getByText('1000 points')).toBeInTheDocument();
  });

  it('should handle reward redemption', async () => {
    vi.mocked(rewardsApi.redeemReward).mockResolvedValue({
      redemption_id: 'redemption-123',
      points_spent: 300,
      new_balance: 700,
      delivery_status: 'pending',
      confirmation_code: 'CONF123',
    });

    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    const redeemButton = await waitFor(() =>
      screen.getAllByText(/redeem/i)[0]
    );

    fireEvent.click(redeemButton);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/confirm redemption/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText(/confirm/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(rewardsApi.redeemReward).toHaveBeenCalled();
    });
  });

  it('should show pending points', async () => {
    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });
  });

  it('should handle insufficient points for redemption', async () => {
    const lowBalance = { balance: 50, pending: 0 };
    vi.mocked(pointsApi.getPointBalance).mockResolvedValue(lowBalance);

    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    const redeemButton = await waitFor(() =>
      screen.getAllByText(/redeem/i)[0]
    );

    fireEvent.click(redeemButton);

    await waitFor(() => {
      expect(screen.getByText(/insufficient points/i)).toBeInTheDocument();
    });
  });

  it('should filter transactions by type', async () => {
    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    const earnFilter = await waitFor(() =>
      screen.getByText(/earn/i)
    );

    fireEvent.click(earnFilter);

    await waitFor(() => {
      expect(pointsApi.getPointTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'earn' })
      );
    });
  });

  it('should paginate transaction history', async () => {
    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Played game/i)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(pointsApi.getPointTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('should show loading state', () => {
    vi.mocked(pointsApi.getPointBalance).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(pointsApi.getPointBalance).mockRejectedValue(
      new Error('Failed to fetch balance')
    );

    render(
      <BrowserRouter>
        <PointsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading/i)).toBeInTheDocument();
    });
  });
});

