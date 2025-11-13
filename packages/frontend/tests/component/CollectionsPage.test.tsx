/**
 * Component Test for Collections Page (User Story 7)
 * T176: Component test for Collections page functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CollectionsPage from '@/pages/Collections/CollectionsPage';
import * as collectionsApi from '@/services/api/collections';

// Mock the collections API
vi.mock('@/services/api/collections', () => ({
  getCollections: vi.fn(),
  createCollection: vi.fn(),
  deleteCollection: vi.fn(),
  updateCollection: vi.fn(),
  addGameToCollection: vi.fn(),
  removeGameFromCollection: vi.fn(),
  getCollectionGames: vi.fn(),
}));

const mockCollections = [
  {
    id: 1,
    name: 'Favorites',
    description: 'My favorite games',
    is_public: true,
    game_count: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Action Games',
    description: 'Collection of action games',
    is_public: false,
    game_count: 3,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

const mockCollectionGames = [
  {
    id: 1,
    game_id: 1,
    collection_id: 1,
    game_title: 'Puzzle Quest',
    game_thumbnail: 'thumb1.jpg',
    added_at: '2024-01-03T00:00:00Z',
  },
  {
    id: 2,
    game_id: 2,
    collection_id: 1,
    game_title: 'Speed Runner',
    game_thumbnail: 'thumb2.jpg',
    added_at: '2024-01-04T00:00:00Z',
  },
];

describe('CollectionsPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderCollectionsPage = () => {
    return render(
      <BrowserRouter>
        <CollectionsPage />
      </BrowserRouter>
    );
  };

  describe('Collections List Display', () => {
    it('should render collections list successfully', async () => {
      vi.mocked(collectionsApi.getCollections).mockResolvedValue({
        collections: mockCollections,
        total: mockCollections.length,
        page: 1,
        limit: 20,
      });

      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText('我的收藏夹')).toBeInTheDocument();
      });

      // Check if collections are displayed
      await waitFor(() => {
        expect(screen.getByText('Favorites')).toBeInTheDocument();
        expect(screen.getByText('Action Games')).toBeInTheDocument();
      });
    });

    it('should display collection metadata', async () => {
      vi.mocked(collectionsApi.getCollections).mockResolvedValue({
        collections: mockCollections,
        total: mockCollections.length,
        page: 1,
        limit: 20,
      });

      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText('5 个游戏')).toBeInTheDocument();
        expect(screen.getByText('3 个游戏')).toBeInTheDocument();
      });
    });

    it('should show empty state when no collections', async () => {
      vi.mocked(collectionsApi.getCollections).mockResolvedValue({
        collections: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText(/还没有收藏夹/i)).toBeInTheDocument();
      });
    });

    it('should handle API error gracefully', async () => {
      vi.mocked(collectionsApi.getCollections).mockRejectedValue(
        new Error('Network error'),
      );

      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText(/加载失败/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create Collection', () => {
    beforeEach(() => {
      vi.mocked(collectionsApi.getCollections).mockResolvedValue({
        collections: mockCollections,
        total: mockCollections.length,
        page: 1,
        limit: 20,
      });
    });

    it('should open create collection modal', async () => {
      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText('我的收藏夹')).toBeInTheDocument();
      });

      // Click create button
      const createButton = screen.getByRole('button', { name: /创建收藏夹/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/新建收藏夹/i)).toBeInTheDocument();
      });
    });

    it('should create a new collection', async () => {
      vi.mocked(collectionsApi.createCollection).mockResolvedValue({
        id: 3,
        name: 'New Collection',
        description: 'Test description',
        is_public: true,
        game_count: 0,
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
      });

      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText('我的收藏夹')).toBeInTheDocument();
      });

      // Open create modal
      const createButton = screen.getByRole('button', { name: /创建收藏夹/i });
      fireEvent.click(createButton);

      // Fill in form
      await waitFor(() => {
        expect(screen.getByLabelText(/收藏夹名称/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/收藏夹名称/i);
      const descInput = screen.getByLabelText(/描述/i);
      
      fireEvent.change(nameInput, { target: { value: 'New Collection' } });
      fireEvent.change(descInput, { target: { value: 'Test description' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /创建/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(collectionsApi.createCollection).toHaveBeenCalledWith({
          name: 'New Collection',
          description: 'Test description',
          is_public: expect.any(Boolean),
        });
      });
    });

    it('should validate required fields', async () => {
      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText('我的收藏夹')).toBeInTheDocument();
      });

      // Open create modal
      const createButton = screen.getByRole('button', { name: /创建收藏夹/i });
      fireEvent.click(createButton);

      // Try to submit without filling in name
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /创建/i })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /创建/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/请输入收藏夹名称/i)).toBeInTheDocument();
      });
    });
  });

  describe('Delete Collection', () => {
    beforeEach(() => {
      vi.mocked(collectionsApi.getCollections).mockResolvedValue({
        collections: mockCollections,
        total: mockCollections.length,
        page: 1,
        limit: 20,
      });
    });

    it('should delete a collection', async () => {
      vi.mocked(collectionsApi.deleteCollection).mockResolvedValue(undefined);

      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText('Favorites')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /删除/i });
      fireEvent.click(deleteButtons[0]);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/确定要删除/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /确定/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(collectionsApi.deleteCollection).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('View Collection Games', () => {
    beforeEach(() => {
      vi.mocked(collectionsApi.getCollections).mockResolvedValue({
        collections: mockCollections,
        total: mockCollections.length,
        page: 1,
        limit: 20,
      });
      vi.mocked(collectionsApi.getCollectionGames).mockResolvedValue({
        games: mockCollectionGames,
        total: mockCollectionGames.length,
      });
    });

    it('should view games in a collection', async () => {
      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText('Favorites')).toBeInTheDocument();
      });

      // Click on collection to view games
      const collectionCard = screen.getByText('Favorites');
      fireEvent.click(collectionCard);

      await waitFor(() => {
        expect(collectionsApi.getCollectionGames).toHaveBeenCalledWith(1);
      });

      // Check if games are displayed
      await waitFor(() => {
        expect(screen.getByText('Puzzle Quest')).toBeInTheDocument();
        expect(screen.getByText('Speed Runner')).toBeInTheDocument();
      });
    });

    it('should remove game from collection', async () => {
      vi.mocked(collectionsApi.removeGameFromCollection).mockResolvedValue(undefined);

      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText('Favorites')).toBeInTheDocument();
      });

      // View collection games
      const collectionCard = screen.getByText('Favorites');
      fireEvent.click(collectionCard);

      await waitFor(() => {
        expect(screen.getByText('Puzzle Quest')).toBeInTheDocument();
      });

      // Remove game from collection
      const removeButtons = screen.getAllByRole('button', { name: /移除/i });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(collectionsApi.removeGameFromCollection).toHaveBeenCalledWith(1, 1);
      });
    });
  });

  describe('Public/Private Toggle', () => {
    beforeEach(() => {
      vi.mocked(collectionsApi.getCollections).mockResolvedValue({
        collections: mockCollections,
        total: mockCollections.length,
        page: 1,
        limit: 20,
      });
    });

    it('should display public badge for public collections', async () => {
      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText('公开')).toBeInTheDocument();
      });
    });

    it('should display private badge for private collections', async () => {
      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText('私密')).toBeInTheDocument();
      });
    });

    it('should toggle collection visibility', async () => {
      vi.mocked(collectionsApi.updateCollection).mockResolvedValue({
        ...mockCollections[1],
        is_public: true,
      });

      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText('Action Games')).toBeInTheDocument();
      });

      // Click edit button and toggle visibility
      const editButtons = screen.getAllByRole('button', { name: /编辑/i });
      fireEvent.click(editButtons[1]);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: /公开/i })).toBeInTheDocument();
      });

      const visibilitySwitch = screen.getByRole('switch', { name: /公开/i });
      fireEvent.click(visibilitySwitch);

      // Save changes
      const saveButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(collectionsApi.updateCollection).toHaveBeenCalledWith(
          2,
          expect.objectContaining({ is_public: true }),
        );
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state', () => {
      vi.mocked(collectionsApi.getCollections).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      renderCollectionsPage();

      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should display error message', async () => {
      vi.mocked(collectionsApi.getCollections).mockRejectedValue(
        new Error('Failed to load collections'),
      );

      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText(/加载失败/i)).toBeInTheDocument();
      });
    });

    it('should retry loading on error', async () => {
      vi.mocked(collectionsApi.getCollections)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          collections: mockCollections,
          total: mockCollections.length,
          page: 1,
          limit: 20,
        });

      renderCollectionsPage();

      await waitFor(() => {
        expect(screen.getByText(/加载失败/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /重试/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Favorites')).toBeInTheDocument();
      });
    });
  });
});

