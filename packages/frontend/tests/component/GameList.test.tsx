/**
 * Component tests for GameList page
 * User Story 1: Browse and Play Mini-Games
 * T039: Component test for GameList page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GameList from '@/pages/Home/GameList';
import * as gamesApi from '@/services/api/games';

// Mock the games API
vi.mock('@/services/api/games', () => ({
  getGames: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('GameList Component (T039)', () => {
  const mockGames = [
    {
      id: '1',
      title: 'Test Game 1',
      description: 'A puzzle game',
      cover_image_url: 'https://example.com/game1.jpg',
      category_tags: ['puzzle', 'casual'],
      play_count: 1000,
      average_rating: 4.5,
    },
    {
      id: '2',
      title: 'Test Game 2',
      description: 'An action game',
      cover_image_url: 'https://example.com/game2.jpg',
      category_tags: ['action', 'arcade'],
      play_count: 2000,
      average_rating: 4.8,
    },
    {
      id: '3',
      title: 'Tetris Clone',
      description: 'Classic block game',
      cover_image_url: 'https://example.com/game3.jpg',
      category_tags: ['puzzle'],
      play_count: 5000,
      average_rating: 4.9,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render game list correctly', async () => {
    vi.mocked(gamesApi.getGames).mockResolvedValue({
      games: mockGames,
      pagination: {
        page: 1,
        limit: 20,
        total: 3,
        total_pages: 1,
      },
    });

    render(
      <BrowserRouter>
        <GameList />
      </BrowserRouter>
    );

    // Wait for games to load
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Game 2')).toBeInTheDocument();
    expect(screen.getByText('Tetris Clone')).toBeInTheDocument();
  });

  it('should display loading state while fetching games', () => {
    vi.mocked(gamesApi.getGames).mockReturnValue(
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(
      <BrowserRouter>
        <GameList />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle empty game list', async () => {
    vi.mocked(gamesApi.getGames).mockResolvedValue({
      games: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0,
      },
    });

    render(
      <BrowserRouter>
        <GameList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no games found/i)).toBeInTheDocument();
    });
  });

  it('should filter games by category', async () => {
    const puzzleGames = mockGames.filter(g => g.category_tags.includes('puzzle'));
    
    vi.mocked(gamesApi.getGames).mockResolvedValue({
      games: puzzleGames,
      pagination: {
        page: 1,
        limit: 20,
        total: puzzleGames.length,
        total_pages: 1,
      },
    });

    render(
      <BrowserRouter>
        <GameList />
      </BrowserRouter>
    );

    // Find and click puzzle category filter
    const puzzleFilter = await waitFor(() => 
      screen.getByText(/puzzle/i)
    );
    fireEvent.click(puzzleFilter);

    await waitFor(() => {
      expect(gamesApi.getGames).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'puzzle' })
      );
    });
  });

  it('should search games by title', async () => {
    const searchTerm = 'tetris';
    const filteredGames = mockGames.filter(g => 
      g.title.toLowerCase().includes(searchTerm)
    );

    vi.mocked(gamesApi.getGames).mockResolvedValue({
      games: filteredGames,
      pagination: {
        page: 1,
        limit: 20,
        total: filteredGames.length,
        total_pages: 1,
      },
    });

    render(
      <BrowserRouter>
        <GameList />
      </BrowserRouter>
    );

    // Find search input and enter search term
    const searchInput = await waitFor(() =>
      screen.getByPlaceholderText(/search games/i)
    );
    fireEvent.change(searchInput, { target: { value: searchTerm } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(gamesApi.getGames).toHaveBeenCalledWith(
        expect.objectContaining({ search: searchTerm })
      );
    });
  });

  it('should navigate to game detail when clicking a game card', async () => {
    vi.mocked(gamesApi.getGames).mockResolvedValue({
      games: mockGames,
      pagination: {
        page: 1,
        limit: 20,
        total: 3,
        total_pages: 1,
      },
    });

    render(
      <BrowserRouter>
        <GameList />
      </BrowserRouter>
    );

    const gameCard = await waitFor(() => 
      screen.getByText('Test Game 1')
    );
    fireEvent.click(gameCard);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/games/1');
    });
  });

  it('should implement pagination', async () => {
    vi.mocked(gamesApi.getGames).mockResolvedValue({
      games: mockGames,
      pagination: {
        page: 1,
        limit: 20,
        total: 50,
        total_pages: 3,
      },
    });

    render(
      <BrowserRouter>
        <GameList />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Game 1')).toBeInTheDocument();
    });

    // Find and click next page button
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(gamesApi.getGames).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('should sort games by popularity', async () => {
    vi.mocked(gamesApi.getGames).mockResolvedValue({
      games: mockGames.sort((a, b) => b.play_count - a.play_count),
      pagination: {
        page: 1,
        limit: 20,
        total: 3,
        total_pages: 1,
      },
    });

    render(
      <BrowserRouter>
        <GameList />
      </BrowserRouter>
    );

    // Find and click sort dropdown
    const sortDropdown = await waitFor(() =>
      screen.getByLabelText(/sort by/i)
    );
    fireEvent.change(sortDropdown, { target: { value: 'popular' } });

    await waitFor(() => {
      expect(gamesApi.getGames).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'popular' })
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(gamesApi.getGames).mockRejectedValue(
      new Error('Failed to fetch games')
    );

    render(
      <BrowserRouter>
        <GameList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading games/i)).toBeInTheDocument();
    });
  });

  it('should display game ratings', async () => {
    vi.mocked(gamesApi.getGames).mockResolvedValue({
      games: mockGames,
      pagination: {
        page: 1,
        limit: 20,
        total: 3,
        total_pages: 1,
      },
    });

    render(
      <BrowserRouter>
        <GameList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('4.9')).toBeInTheDocument();
    });
  });

  it('should display play count', async () => {
    vi.mocked(gamesApi.getGames).mockResolvedValue({
      games: mockGames,
      pagination: {
        page: 1,
        limit: 20,
        total: 3,
        total_pages: 1,
      },
    });

    render(
      <BrowserRouter>
        <GameList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/1000.*plays/i)).toBeInTheDocument();
      expect(screen.getByText(/2000.*plays/i)).toBeInTheDocument();
      expect(screen.getByText(/5000.*plays/i)).toBeInTheDocument();
    });
  });
});

