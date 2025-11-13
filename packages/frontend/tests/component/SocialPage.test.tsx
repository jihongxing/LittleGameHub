/**
 * Component Test for Social Page (User Story 6)
 * T154: Component test for Social page functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SocialPage from '@/pages/Social/SocialPage';
import * as socialApi from '@/services/api/social';

// Mock the social API
vi.mock('@/services/api/social', () => ({
  getFriends: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  rejectFriendRequest: vi.fn(),
  getLeaderboard: vi.fn(),
  getFriendActivity: vi.fn(),
}));

// Mock WebSocket client
vi.mock('@/services/websocket/client', () => ({
  connectWebSocket: vi.fn(),
  disconnectWebSocket: vi.fn(),
  subscribeToNotifications: vi.fn(),
}));

const mockFriends = [
  {
    id: 1,
    username: 'friend1',
    email: 'friend1@example.com',
    avatar: 'avatar1.jpg',
    status: 'accepted',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'friend2',
    email: 'friend2@example.com',
    avatar: 'avatar2.jpg',
    status: 'accepted',
    created_at: '2024-01-02T00:00:00Z',
  },
];

const mockPendingRequests = [
  {
    id: 3,
    username: 'pending_friend',
    email: 'pending@example.com',
    avatar: 'avatar3.jpg',
    status: 'pending',
    created_at: '2024-01-03T00:00:00Z',
  },
];

const mockLeaderboard = [
  {
    rank: 1,
    user_id: 1,
    username: 'friend1',
    score: 2500,
    avatar: 'avatar1.jpg',
  },
  {
    rank: 2,
    user_id: 4,
    username: 'current_user',
    score: 2000,
    avatar: 'avatar_current.jpg',
  },
  {
    rank: 3,
    user_id: 2,
    username: 'friend2',
    score: 1800,
    avatar: 'avatar2.jpg',
  },
];

const mockFriendActivity = [
  {
    id: 1,
    friend_id: 1,
    friend_username: 'friend1',
    activity_type: 'game_completed',
    game_title: 'Puzzle Quest',
    score: 1500,
    timestamp: '2024-01-05T10:00:00Z',
  },
  {
    id: 2,
    friend_id: 2,
    friend_username: 'friend2',
    activity_type: 'achievement_unlocked',
    achievement_name: 'Speed Demon',
    timestamp: '2024-01-05T09:30:00Z',
  },
];

describe('SocialPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSocialPage = () => {
    return render(
      <BrowserRouter>
        <SocialPage />
      </BrowserRouter>
    );
  };

  describe('Friend List Display', () => {
    it('should render friend list successfully', async () => {
      vi.mocked(socialApi.getFriends).mockResolvedValue({
        friends: mockFriends,
        total: mockFriends.length,
      });

      renderSocialPage();

      await waitFor(() => {
        expect(screen.getByText('好友列表')).toBeInTheDocument();
      });

      // Check if friends are displayed
      await waitFor(() => {
        expect(screen.getByText('friend1')).toBeInTheDocument();
        expect(screen.getByText('friend2')).toBeInTheDocument();
      });
    });

    it('should display pending friend requests', async () => {
      vi.mocked(socialApi.getFriends).mockResolvedValue({
        friends: mockFriends,
        pending_requests: mockPendingRequests,
        total: mockFriends.length,
      });

      renderSocialPage();

      await waitFor(() => {
        expect(screen.getByText('pending_friend')).toBeInTheDocument();
        expect(screen.getByText('待处理')).toBeInTheDocument();
      });
    });

    it('should show empty state when no friends', async () => {
      vi.mocked(socialApi.getFriends).mockResolvedValue({
        friends: [],
        total: 0,
      });

      renderSocialPage();

      await waitFor(() => {
        expect(screen.getByText(/还没有好友/i)).toBeInTheDocument();
      });
    });

    it('should handle API error gracefully', async () => {
      vi.mocked(socialApi.getFriends).mockRejectedValue(
        new Error('Network error'),
      );

      renderSocialPage();

      await waitFor(() => {
        expect(screen.getByText(/加载失败/i)).toBeInTheDocument();
      });
    });
  });

  describe('Friend Request Actions', () => {
    beforeEach(() => {
      vi.mocked(socialApi.getFriends).mockResolvedValue({
        friends: mockFriends,
        pending_requests: mockPendingRequests,
        total: mockFriends.length,
      });
    });

    it('should send friend request', async () => {
      vi.mocked(socialApi.sendFriendRequest).mockResolvedValue({
        id: 4,
        friend_id: 5,
        status: 'pending',
      });

      renderSocialPage();

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('好友列表')).toBeInTheDocument();
      });

      // Click add friend button
      const addButton = screen.getByRole('button', { name: /添加好友/i });
      fireEvent.click(addButton);

      // Fill in friend ID/username
      const input = screen.getByPlaceholderText(/输入好友ID或用户名/i);
      fireEvent.change(input, { target: { value: '5' } });

      // Submit request
      const submitButton = screen.getByRole('button', { name: /发送请求/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(socialApi.sendFriendRequest).toHaveBeenCalledWith(5);
        expect(screen.getByText(/请求已发送/i)).toBeInTheDocument();
      });
    });

    it('should accept friend request', async () => {
      vi.mocked(socialApi.acceptFriendRequest).mockResolvedValue({
        id: 3,
        status: 'accepted',
      });

      renderSocialPage();

      await waitFor(() => {
        expect(screen.getByText('pending_friend')).toBeInTheDocument();
      });

      // Click accept button
      const acceptButton = screen.getByRole('button', { name: /接受/i });
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(socialApi.acceptFriendRequest).toHaveBeenCalledWith(3);
        expect(screen.getByText(/已接受/i)).toBeInTheDocument();
      });
    });

    it('should reject friend request', async () => {
      vi.mocked(socialApi.rejectFriendRequest).mockResolvedValue({
        id: 3,
        status: 'rejected',
      });

      renderSocialPage();

      await waitFor(() => {
        expect(screen.getByText('pending_friend')).toBeInTheDocument();
      });

      // Click reject button
      const rejectButton = screen.getByRole('button', { name: /拒绝/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(socialApi.rejectFriendRequest).toHaveBeenCalledWith(3);
      });
    });
  });

  describe('Leaderboard Display', () => {
    it('should render leaderboard successfully', async () => {
      vi.mocked(socialApi.getFriends).mockResolvedValue({
        friends: mockFriends,
        total: mockFriends.length,
      });
      vi.mocked(socialApi.getLeaderboard).mockResolvedValue({
        leaderboard: mockLeaderboard,
        current_user_rank: 2,
        total: mockLeaderboard.length,
      });

      renderSocialPage();

      // Switch to leaderboard tab
      const leaderboardTab = screen.getByRole('tab', { name: /排行榜/i });
      fireEvent.click(leaderboardTab);

      await waitFor(() => {
        expect(screen.getByText('friend1')).toBeInTheDocument();
        expect(screen.getByText('2500')).toBeInTheDocument();
      });

      // Check rank display
      expect(screen.getByText('1')).toBeInTheDocument(); // Rank 1
      expect(screen.getByText('2')).toBeInTheDocument(); // Rank 2
      expect(screen.getByText('3')).toBeInTheDocument(); // Rank 3
    });

    it('should filter leaderboard by game', async () => {
      vi.mocked(socialApi.getFriends).mockResolvedValue({
        friends: mockFriends,
        total: mockFriends.length,
      });
      vi.mocked(socialApi.getLeaderboard).mockResolvedValue({
        leaderboard: mockLeaderboard,
        current_user_rank: 2,
        total: mockLeaderboard.length,
      });

      renderSocialPage();

      // Switch to leaderboard tab
      const leaderboardTab = screen.getByRole('tab', { name: /排行榜/i });
      fireEvent.click(leaderboardTab);

      // Select game filter
      const gameSelect = screen.getByRole('combobox', { name: /选择游戏/i });
      fireEvent.change(gameSelect, { target: { value: '1' } });

      await waitFor(() => {
        expect(socialApi.getLeaderboard).toHaveBeenCalledWith(
          expect.objectContaining({ game_id: 1 }),
        );
      });
    });

    it('should toggle between global and friends leaderboard', async () => {
      vi.mocked(socialApi.getFriends).mockResolvedValue({
        friends: mockFriends,
        total: mockFriends.length,
      });
      vi.mocked(socialApi.getLeaderboard).mockResolvedValue({
        leaderboard: mockLeaderboard,
        current_user_rank: 2,
        total: mockLeaderboard.length,
      });

      renderSocialPage();

      // Switch to leaderboard tab
      const leaderboardTab = screen.getByRole('tab', { name: /排行榜/i });
      fireEvent.click(leaderboardTab);

      // Toggle to friends scope
      const friendsToggle = screen.getByRole('radio', { name: /好友/i });
      fireEvent.click(friendsToggle);

      await waitFor(() => {
        expect(socialApi.getLeaderboard).toHaveBeenCalledWith(
          expect.objectContaining({ scope: 'friends' }),
        );
      });
    });
  });

  describe('Friend Activity Feed', () => {
    it('should display friend activity', async () => {
      vi.mocked(socialApi.getFriends).mockResolvedValue({
        friends: mockFriends,
        total: mockFriends.length,
      });
      vi.mocked(socialApi.getFriendActivity).mockResolvedValue({
        activities: mockFriendActivity,
        total: mockFriendActivity.length,
      });

      renderSocialPage();

      // Switch to activity tab
      const activityTab = screen.getByRole('tab', { name: /动态/i });
      fireEvent.click(activityTab);

      await waitFor(() => {
        expect(screen.getByText('friend1')).toBeInTheDocument();
        expect(screen.getByText('Puzzle Quest')).toBeInTheDocument();
        expect(screen.getByText('friend2')).toBeInTheDocument();
        expect(screen.getByText('Speed Demon')).toBeInTheDocument();
      });
    });

    it('should show empty state when no activity', async () => {
      vi.mocked(socialApi.getFriends).mockResolvedValue({
        friends: mockFriends,
        total: mockFriends.length,
      });
      vi.mocked(socialApi.getFriendActivity).mockResolvedValue({
        activities: [],
        total: 0,
      });

      renderSocialPage();

      // Switch to activity tab
      const activityTab = screen.getByRole('tab', { name: /动态/i });
      fireEvent.click(activityTab);

      await waitFor(() => {
        expect(screen.getByText(/暂无好友动态/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update friend list when receiving notification', async () => {
      const { rerender } = renderSocialPage();

      vi.mocked(socialApi.getFriends).mockResolvedValue({
        friends: mockFriends,
        total: mockFriends.length,
      });

      await waitFor(() => {
        expect(screen.getByText('friend1')).toBeInTheDocument();
      });

      // Simulate WebSocket notification
      const newFriend = {
        id: 5,
        username: 'new_friend',
        email: 'new@example.com',
        avatar: 'avatar5.jpg',
        status: 'accepted',
        created_at: '2024-01-06T00:00:00Z',
      };

      vi.mocked(socialApi.getFriends).mockResolvedValue({
        friends: [...mockFriends, newFriend],
        total: mockFriends.length + 1,
      });

      // Trigger re-render
      rerender(
        <BrowserRouter>
          <SocialPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('new_friend')).toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state', () => {
      vi.mocked(socialApi.getFriends).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      renderSocialPage();

      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should display error message', async () => {
      vi.mocked(socialApi.getFriends).mockRejectedValue(
        new Error('Failed to load friends'),
      );

      renderSocialPage();

      await waitFor(() => {
        expect(screen.getByText(/加载失败/i)).toBeInTheDocument();
      });
    });

    it('should retry loading on error', async () => {
      vi.mocked(socialApi.getFriends)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          friends: mockFriends,
          total: mockFriends.length,
        });

      renderSocialPage();

      await waitFor(() => {
        expect(screen.getByText(/加载失败/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /重试/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('friend1')).toBeInTheDocument();
      });
    });
  });
});

