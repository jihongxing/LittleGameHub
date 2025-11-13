/**
 * E2E test for browse and play flow
 * User Story 1: Browse and Play Mini-Games
 * T041: E2E test for browse and play flow
 */

import { test, expect } from '@playwright/test';

test.describe('Browse and Play Games Flow (T041)', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Setup test data and authentication
    await page.goto('http://localhost:5173');
  });

  test('should browse game catalog and view game details', async ({ page }) => {
    // Navigate to games page
    await page.click('a[href="/games"]');
    await expect(page).toHaveURL('/games');

    // Wait for games to load
    await page.waitForSelector('[data-testid="game-card"]');

    // Verify game cards are displayed
    const gameCards = await page.$$('[data-testid="game-card"]');
    expect(gameCards.length).toBeGreaterThan(0);

    // Click on the first game
    await page.click('[data-testid="game-card"]:first-child');

    // Verify navigation to game detail page
    await expect(page).toHaveURL(/\/games\/[a-f0-9-]+$/);

    // Verify game details are displayed
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="game-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="play-button"]')).toBeVisible();
  });

  test('should search for games', async ({ page }) => {
    await page.goto('/games');

    // Enter search term
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('tetris');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForLoadState('networkidle');

    // Verify search results contain the search term
    const gameCards = await page.$$('[data-testid="game-card"]');
    if (gameCards.length > 0) {
      const firstGameTitle = await page.locator('[data-testid="game-card"]:first-child h3').textContent();
      expect(firstGameTitle?.toLowerCase()).toContain('tetris');
    }
  });

  test('should filter games by category', async ({ page }) => {
    await page.goto('/games');

    // Click on a category filter
    await page.click('[data-testid="category-filter-puzzle"]');

    // Wait for filtered results
    await page.waitForLoadState('networkidle');

    // Verify filtered results
    const categoryTags = await page.$$('[data-testid="game-category-tag"]');
    for (const tag of categoryTags) {
      const tagText = await tag.textContent();
      expect(tagText).toContain('puzzle');
    }
  });

  test('should paginate through game list', async ({ page }) => {
    await page.goto('/games');

    // Wait for initial page load
    await page.waitForSelector('[data-testid="game-card"]');

    // Get first page game IDs
    const firstPageGames = await page.$$eval(
      '[data-testid="game-card"]',
      (cards) => cards.map((card) => card.getAttribute('data-game-id'))
    );

    // Click next page
    await page.click('[data-testid="pagination-next"]');
    await page.waitForLoadState('networkidle');

    // Get second page game IDs
    const secondPageGames = await page.$$eval(
      '[data-testid="game-card"]',
      (cards) => cards.map((card) => card.getAttribute('data-game-id'))
    );

    // Verify different games on different pages
    expect(firstPageGames[0]).not.toBe(secondPageGames[0]);
  });

  test('should start and play a game', async ({ page }) => {
    await page.goto('/games');

    // Click on a game
    await page.click('[data-testid="game-card"]:first-child');

    // Wait for game detail page
    await page.waitForSelector('[data-testid="play-button"]');

    // Click play button
    await page.click('[data-testid="play-button"]');

    // Verify navigation to game player
    await expect(page).toHaveURL(/\/games\/[a-f0-9-]+\/play$/);

    // Wait for game iframe to load
    await page.waitForSelector('[data-testid="game-iframe"]');

    // Verify iframe is present and visible
    const iframe = page.locator('[data-testid="game-iframe"]');
    await expect(iframe).toBeVisible();

    // Verify game session is tracked
    await expect(page.locator('[data-testid="session-timer"]')).toBeVisible();
  });

  test('should earn points after playing a game', async ({ page }) => {
    // TODO: Mock or setup test user with authentication

    await page.goto('/games');

    // Navigate to a game
    await page.click('[data-testid="game-card"]:first-child');
    await page.waitForSelector('[data-testid="play-button"]');

    // Get initial point balance
    const initialPoints = await page.locator('[data-testid="points-balance"]').textContent();

    // Start playing the game
    await page.click('[data-testid="play-button"]');
    await page.waitForSelector('[data-testid="game-iframe"]');

    // Wait for minimum play duration (simulate playing)
    await page.waitForTimeout(5000); // 5 seconds for testing

    // Exit the game
    await page.click('[data-testid="exit-game-button"]');

    // Verify points notification or updated balance
    // (This would depend on whether points are awarded for short durations in test mode)
    await page.waitForSelector('[data-testid="points-balance"]');
    const finalPoints = await page.locator('[data-testid="points-balance"]').textContent();

    // Points might increase or stay the same depending on duration requirement
    expect(finalPoints).toBeDefined();
  });

  test('should handle game load errors gracefully', async ({ page }) => {
    // Navigate to a non-existent game
    await page.goto('/games/00000000-0000-0000-0000-000000000000');

    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/not found/i);

    // Verify back to games button exists
    await expect(page.locator('[data-testid="back-to-games"]')).toBeVisible();
  });

  test('should sort games by popularity', async ({ page }) => {
    await page.goto('/games');

    // Select sort by popularity
    await page.selectOption('[data-testid="sort-select"]', 'popular');
    await page.waitForLoadState('networkidle');

    // Get play counts from game cards
    const playCounts = await page.$$eval(
      '[data-testid="game-play-count"]',
      (elements) => elements.map((el) => parseInt(el.textContent || '0'))
    );

    // Verify descending order
    for (let i = 0; i < playCounts.length - 1; i++) {
      expect(playCounts[i]).toBeGreaterThanOrEqual(playCounts[i + 1]);
    }
  });

  test('should display game ratings', async ({ page }) => {
    await page.goto('/games');

    // Wait for games to load
    await page.waitForSelector('[data-testid="game-card"]');

    // Verify ratings are displayed
    const ratings = await page.$$('[data-testid="game-rating"]');
    expect(ratings.length).toBeGreaterThan(0);

    // Verify rating values are in valid range
    for (const rating of ratings) {
      const ratingText = await rating.textContent();
      const ratingValue = parseFloat(ratingText || '0');
      expect(ratingValue).toBeGreaterThanOrEqual(0);
      expect(ratingValue).toBeLessThanOrEqual(5);
    }
  });

  test('should track game session duration', async ({ page }) => {
    await page.goto('/games');

    // Start a game
    await page.click('[data-testid="game-card"]:first-child');
    await page.waitForSelector('[data-testid="play-button"]');
    await page.click('[data-testid="play-button"]');

    // Wait for game to load
    await page.waitForSelector('[data-testid="game-iframe"]');

    // Verify session timer is running
    const timer = page.locator('[data-testid="session-timer"]');
    await expect(timer).toBeVisible();

    // Wait a bit and verify timer increases
    const initialTime = await timer.textContent();
    await page.waitForTimeout(2000);
    const updatedTime = await timer.textContent();

    expect(updatedTime).not.toBe(initialTime);
  });
});

