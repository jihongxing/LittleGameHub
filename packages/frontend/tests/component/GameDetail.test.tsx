/**
 * Component tests for GameDetail page
 * User Story 1: Browse and Play Mini-Games
 * T040: Component test for GameDetail page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GameDetail from '@/pages/Game/GameDetail';
import * as gamesApi from '@/services/api/games';

// Mock the games API
vi.mock('@/services/api/games', () => ({
  getGameById: vi.fn(),
  startGameSession: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'test-game-id' }),
  };
});

describe('GameDetail Component (T040)', () => {
  const mockGame = {
    id: 'test-game-id',
    title: 'Test Game',
    description: 'A fantastic puzzle game with challenging levels',
    cover_image_url: 'https://example.com/game.jpg',
    game_url: 'https://example.com/game.html',
    category_tags: ['puzzle', 'casual'],
    point_reward_rules: {
      base_points: 10,
      min_duration_seconds: 180,
      points_per_minute: 5,
      max_points_per_session: 100,
    },
    min_play_duration_seconds: 180,
    play_count: 10000,
    average_rating: 4.7,
    version: '1.2.0',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render game details correctly', async () => {
    vi.mocked(gamesApi.getGameById).mockResolvedValue(mockGame);

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Game')).toBeInTheDocument();
    });

    expect(screen.getByText(/A fantastic puzzle game/i)).toBeInTheDocument();
    expect(screen.getByText(/4.7/i)).toBeInTheDocument();
    expect(screen.getByText(/10000/i)).toBeInTheDocument();
  });

  it('should display loading state while fetching game details', () => {
    vi.mocked(gamesApi.getGameById).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display category tags', async () => {
    vi.mocked(gamesApi.getGameById).mockResolvedValue(mockGame);

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('puzzle')).toBeInTheDocument();
      expect(screen.getByText('casual')).toBeInTheDocument();
    });
  });

  it('should display point reward information', async () => {
    vi.mocked(gamesApi.getGameById).mockResolvedValue(mockGame);

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/earn up to 100 points/i)).toBeInTheDocument();
      expect(screen.getByText(/5 points per minute/i)).toBeInTheDocument();
      expect(screen.getByText(/play for at least 3 minutes/i)).toBeInTheDocument();
    });
  });

  it('should have a play button', async () => {
    vi.mocked(gamesApi.getGameById).mockResolvedValue(mockGame);

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    const playButton = await waitFor(() =>
      screen.getByRole('button', { name: /play now/i })
    );

    expect(playButton).toBeInTheDocument();
    expect(playButton).not.toBeDisabled();
  });

  it('should navigate to game player when play button is clicked', async () => {
    vi.mocked(gamesApi.getGameById).mockResolvedValue(mockGame);
    vi.mocked(gamesApi.startGameSession).mockResolvedValue({
      session_id: 'test-session-id',
      game_id: 'test-game-id',
      start_time: new Date().toISOString(),
    });

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    const playButton = await waitFor(() =>
      screen.getByRole('button', { name: /play now/i })
    );

    fireEvent.click(playButton);

    await waitFor(() => {
      expect(gamesApi.startGameSession).toHaveBeenCalledWith('test-game-id');
      expect(mockNavigate).toHaveBeenCalledWith('/games/test-game-id/play');
    });
  });

  it('should handle 404 for non-existent game', async () => {
    vi.mocked(gamesApi.getGameById).mockRejectedValue({
      response: { status: 404 },
    });

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/game not found/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(gamesApi.getGameById).mockRejectedValue(
      new Error('Failed to fetch game')
    );

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading game/i)).toBeInTheDocument();
    });
  });

  it('should display game cover image', async () => {
    vi.mocked(gamesApi.getGameById).mockResolvedValue(mockGame);

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    const image = await waitFor(() =>
      screen.getByAltText('Test Game')
    ) as HTMLImageElement;

    expect(image).toBeInTheDocument();
    expect(image.src).toContain('example.com/game.jpg');
  });

  it('should display game version', async () => {
    vi.mocked(gamesApi.getGameById).mockResolvedValue(mockGame);

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/version 1.2.0/i)).toBeInTheDocument();
    });
  });

  it('should have a back button to return to game list', async () => {
    vi.mocked(gamesApi.getGameById).mockResolvedValue(mockGame);

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    const backButton = await waitFor(() =>
      screen.getByRole('button', { name: /back/i })
    );

    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/games');
  });

  it('should show inactive game warning', async () => {
    const inactiveGame = {
      ...mockGame,
      availability_status: 'inactive',
    };
    vi.mocked(gamesApi.getGameById).mockResolvedValue(inactiveGame);

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/game is currently unavailable/i)).toBeInTheDocument();
    });

    const playButton = screen.getByRole('button', { name: /play now/i });
    expect(playButton).toBeDisabled();
  });

  it('should show maintenance warning', async () => {
    const maintenanceGame = {
      ...mockGame,
      availability_status: 'maintenance',
    };
    vi.mocked(gamesApi.getGameById).mockResolvedValue(maintenanceGame);

    render(
      <BrowserRouter>
        <GameDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/under maintenance/i)).toBeInTheDocument();
    });
  });
});

