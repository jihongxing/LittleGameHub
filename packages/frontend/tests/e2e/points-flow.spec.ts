/**
 * E2E test for earn and redeem points flow
 * User Story 2: Earn and Manage Points
 * T067: E2E test for earn and redeem flow
 */

import { test, expect } from '@playwright/test';

test.describe('Points Earn and Redeem Flow (T067)', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Setup test data and authentication
    await page.goto('http://localhost:5173');
    
    // Navigate to points page
    await page.click('a[href="/points"]');
    await expect(page).toHaveURL('/points');
  });

  test('should display point balance', async ({ page }) => {
    // Wait for balance to load
    await page.waitForSelector('[data-testid="point-balance"]');

    const balance = await page.locator('[data-testid="point-balance"]').textContent();
    expect(balance).toBeTruthy();
    expect(parseInt(balance || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should complete daily check-in task', async ({ page }) => {
    // Find daily check-in task
    const checkInTask = page.locator('[data-testid="task-daily_checkin"]');
    await expect(checkInTask).toBeVisible();

    // Get initial balance
    const initialBalance = await page.locator('[data-testid="point-balance"]').textContent();

    // Click check-in button
    await checkInTask.locator('[data-testid="complete-task-button"]').click();

    // Wait for completion
    await page.waitForLoadState('networkidle');

    // Verify points were awarded
    const newBalance = await page.locator('[data-testid="point-balance"]').textContent();
    expect(parseInt(newBalance || '0')).toBeGreaterThan(parseInt(initialBalance || '0'));

    // Verify task is marked as completed
    await expect(checkInTask.locator('[data-testid="task-status"]')).toContainText(/completed/i);
  });

  test('should show transaction history after earning points', async ({ page }) => {
    // Complete a task
    const task = page.locator('[data-testid^="task-"]').first();
    await task.locator('[data-testid="complete-task-button"]').click();
    await page.waitForLoadState('networkidle');

    // Navigate to transaction history
    await page.click('[data-testid="transaction-history-tab"]');

    // Verify transaction appears
    const transactions = page.locator('[data-testid="transaction-item"]');
    await expect(transactions.first()).toBeVisible();

    const firstTransaction = transactions.first();
    await expect(firstTransaction).toContainText(/earn/i);
  });

  test('should browse available rewards', async ({ page }) => {
    // Navigate to rewards section
    await page.click('[data-testid="rewards-tab"]');

    // Wait for rewards to load
    await page.waitForSelector('[data-testid="reward-card"]');

    const rewards = await page.$$('[data-testid="reward-card"]');
    expect(rewards.length).toBeGreaterThan(0);

    // Verify reward details are shown
    const firstReward = page.locator('[data-testid="reward-card"]').first();
    await expect(firstReward.locator('[data-testid="reward-name"]')).toBeVisible();
    await expect(firstReward.locator('[data-testid="reward-cost"]')).toBeVisible();
  });

  test('should redeem a reward successfully', async ({ page }) => {
    // Navigate to rewards
    await page.click('[data-testid="rewards-tab"]');
    await page.waitForSelector('[data-testid="reward-card"]');

    // Get initial balance
    const initialBalance = parseInt(
      (await page.locator('[data-testid="point-balance"]').textContent()) || '0'
    );

    // Find an affordable reward
    const rewards = await page.$$('[data-testid="reward-card"]');
    let rewardToRedeem = null;
    let rewardCost = 0;

    for (const reward of rewards) {
      const costText = await reward.getAttribute('[data-testid="reward-cost"]');
      const cost = parseInt(costText || '0');
      if (cost <= initialBalance) {
        rewardToRedeem = reward;
        rewardCost = cost;
        break;
      }
    }

    if (rewardToRedeem) {
      // Click redeem button
      await rewardToRedeem.locator('[data-testid="redeem-button"]').click();

      // Confirm redemption
      await page.waitForSelector('[data-testid="confirm-redemption-dialog"]');
      await page.click('[data-testid="confirm-redeem-button"]');

      // Wait for redemption to complete
      await page.waitForLoadState('networkidle');

      // Verify success message
      await expect(page.locator('[data-testid="redemption-success"]')).toBeVisible();

      // Verify confirmation code is shown
      await expect(page.locator('[data-testid="confirmation-code"]')).toBeVisible();

      // Verify points were deducted
      const newBalance = parseInt(
        (await page.locator('[data-testid="point-balance"]').textContent()) || '0'
      );
      expect(newBalance).toBe(initialBalance - rewardCost);
    }
  });

  test('should prevent redeeming with insufficient points', async ({ page }) => {
    await page.click('[data-testid="rewards-tab"]');
    await page.waitForSelector('[data-testid="reward-card"]');

    const balance = parseInt(
      (await page.locator('[data-testid="point-balance"]').textContent()) || '0'
    );

    // Find an expensive reward (more than balance)
    const expensiveReward = page.locator('[data-testid="reward-card"]').filter({
      has: page.locator('[data-testid="reward-cost"]', {
        hasText: new RegExp(`[${balance + 1}-9999999]`),
      }),
    }).first();

    if (await expensiveReward.isVisible()) {
      // Try to redeem
      await expensiveReward.locator('[data-testid="redeem-button"]').click();

      // Should show insufficient points message
      await expect(page.locator('[data-testid="insufficient-points-warning"]')).toBeVisible();

      // Redeem button should be disabled
      const confirmButton = page.locator('[data-testid="confirm-redeem-button"]');
      await expect(confirmButton).toBeDisabled();
    }
  });

  test('should display point tasks with rewards', async ({ page }) => {
    await page.click('[data-testid="tasks-tab"]');

    const tasks = await page.$$('[data-testid^="task-"]');
    expect(tasks.length).toBeGreaterThan(0);

    for (const task of tasks) {
      // Each task should show point reward
      await expect(task.locator('[data-testid="task-reward"]')).toBeVisible();
      
      const reward = await task.locator('[data-testid="task-reward"]').textContent();
      expect(parseInt(reward || '0')).toBeGreaterThan(0);
    }
  });

  test('should show task cooldown timer', async ({ page }) => {
    // Complete a task
    const task = page.locator('[data-testid="task-daily_checkin"]');
    await task.locator('[data-testid="complete-task-button"]').click();
    await page.waitForLoadState('networkidle');

    // Task should show cooldown
    await expect(task.locator('[data-testid="task-cooldown"]')).toBeVisible();
    await expect(task.locator('[data-testid="complete-task-button"]')).toBeDisabled();
  });

  test('should filter transaction history by type', async ({ page }) => {
    await page.click('[data-testid="transaction-history-tab"]');

    // Select earn filter
    await page.click('[data-testid="filter-earn"]');
    await page.waitForLoadState('networkidle');

    // All transactions should be earn type
    const transactions = await page.$$('[data-testid="transaction-item"]');
    for (const transaction of transactions) {
      const type = await transaction.locator('[data-testid="transaction-type"]').textContent();
      expect(type).toContain('earn');
    }

    // Select spend filter
    await page.click('[data-testid="filter-spend"]');
    await page.waitForLoadState('networkidle');

    // All transactions should be spend type
    const spendTransactions = await page.$$('[data-testid="transaction-item"]');
    for (const transaction of spendTransactions) {
      const type = await transaction.locator('[data-testid="transaction-type"]').textContent();
      expect(type).toContain('spend');
    }
  });

  test('should paginate transaction history', async ({ page }) => {
    await page.click('[data-testid="transaction-history-tab"]');
    await page.waitForSelector('[data-testid="transaction-item"]');

    // Get first page transactions
    const firstPageTxIds = await page.$$eval(
      '[data-testid="transaction-item"]',
      (items) => items.map((item) => item.getAttribute('data-transaction-id'))
    );

    // Go to next page
    await page.click('[data-testid="pagination-next"]');
    await page.waitForLoadState('networkidle');

    // Get second page transactions
    const secondPageTxIds = await page.$$eval(
      '[data-testid="transaction-item"]',
      (items) => items.map((item) => item.getAttribute('data-transaction-id'))
    );

    // Transactions should be different
    expect(firstPageTxIds[0]).not.toBe(secondPageTxIds[0]);
  });

  test('should show pending points', async ({ page }) => {
    const pendingPoints = page.locator('[data-testid="pending-points"]');
    await expect(pendingPoints).toBeVisible();

    const pendingValue = await pendingPoints.textContent();
    expect(parseInt(pendingValue || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should complete watch ad task', async ({ page }) => {
    const adTask = page.locator('[data-testid="task-watch_ad"]');
    
    if (await adTask.isVisible()) {
      await adTask.locator('[data-testid="complete-task-button"]').click();

      // Should show ad player or redirect
      await page.waitForSelector('[data-testid="ad-player"]');

      // Wait for ad to complete (or skip if test mode)
      await page.waitForTimeout(2000);

      // Verify points were awarded
      await expect(page.locator('[data-testid="ad-completion-message"]')).toBeVisible();
    }
  });

  test('should show reward delivery status after redemption', async ({ page }) => {
    // Redeem a reward (assuming sufficient balance)
    await page.click('[data-testid="rewards-tab"]');
    await page.waitForSelector('[data-testid="reward-card"]');
    
    const firstReward = page.locator('[data-testid="reward-card"]').first();
    await firstReward.locator('[data-testid="redeem-button"]').click();
    await page.click('[data-testid="confirm-redeem-button"]');
    await page.waitForLoadState('networkidle');

    // Check redemption history
    await page.click('[data-testid="redemption-history-tab"]');
    
    const redemptions = page.locator('[data-testid="redemption-item"]');
    await expect(redemptions.first()).toBeVisible();

    // Verify delivery status
    await expect(redemptions.first().locator('[data-testid="delivery-status"]')).toBeVisible();
  });
});

