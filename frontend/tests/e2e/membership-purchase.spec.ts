/**
 * E2E Test for Membership Purchase Flow
 * Test: T097
 * 
 * Test Coverage:
 * - Complete membership purchase flow
 * - Payment method selection
 * - Payment processing
 * - Membership activation
 * - Privilege verification (ad-free, point multiplier)
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Membership Purchase Flow E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to application
    await page.goto('http://localhost:3000');
    
    // Register/Login
    await page.click('text=Sign Up');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Test123456!');
    await page.fill('input[name="nickname"]', 'E2E Test User');
    await page.click('button:has-text("Register")');
    
    // Wait for registration to complete
    await page.waitForSelector('text=Dashboard', { timeout: 5000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should complete monthly membership purchase with WeChat Pay', async () => {
    // Navigate to membership page
    await page.click('text=Membership');
    await expect(page).toHaveURL(/.*membership/);
    
    // Verify membership plans are displayed
    await expect(page.locator('text=Monthly Membership')).toBeVisible();
    await expect(page.locator('text=Quarterly Membership')).toBeVisible();
    await expect(page.locator('text=Yearly Membership')).toBeVisible();
    
    // Select monthly plan
    await page.click('button:has-text("Subscribe"):first');
    
    // Payment method selection dialog should appear
    await expect(page.locator('text=Select Payment Method')).toBeVisible();
    
    // Select WeChat Pay
    await page.click('input[value="wechat"]');
    await page.click('button:has-text("Confirm")');
    
    // Mock payment success (in real scenario, this would be payment provider page)
    // For testing, we assume mock payment succeeds immediately
    await page.waitForTimeout(2000);
    
    // Verify success message
    await expect(page.locator('text=Membership Activated')).toBeVisible({ timeout: 10000 });
    
    // Verify membership status is updated
    await expect(page.locator('text=Active Member')).toBeVisible();
    await expect(page.locator('text=Expires:')).toBeVisible();
  });

  test('should complete yearly membership purchase with Alipay', async () => {
    await page.click('text=Membership');
    
    // Select yearly plan
    const yearlyPlanButton = page.locator('button:has-text("Subscribe")').nth(2);
    await yearlyPlanButton.click();
    
    // Select Alipay
    await page.click('input[value="alipay"]');
    await page.click('button:has-text("Confirm")');
    
    await page.waitForTimeout(2000);
    
    // Verify success
    await expect(page.locator('text=Membership Activated')).toBeVisible({ timeout: 10000 });
  });

  test('should display point multiplier after membership activation', async () => {
    // Purchase membership
    await page.click('text=Membership');
    await page.click('button:has-text("Subscribe"):first');
    await page.click('input[value="wechat"]');
    await page.click('button:has-text("Confirm")');
    
    await page.waitForTimeout(2000);
    
    // Navigate to points page
    await page.click('text=Points');
    
    // Verify point multiplier badge is displayed
    await expect(page.locator('text=1.3x')).toBeVisible();
  });

  test('should show ad-free experience after membership activation', async () => {
    // Purchase membership
    await page.click('text=Membership');
    await page.click('button:has-text("Subscribe"):first');
    await page.click('input[value="wechat"]');
    await page.click('button:has-text("Confirm")');
    
    await page.waitForTimeout(2000);
    
    // Navigate to games page
    await page.click('text=Games');
    await page.click('.game-card:first-child');
    
    // Verify no ads are shown
    const adElement = page.locator('[data-testid="advertisement"]');
    await expect(adElement).not.toBeVisible();
    
    // Verify ad-free badge
    await expect(page.locator('text=Ad-Free')).toBeVisible();
  });

  test('should prevent duplicate subscription', async () => {
    // First subscription
    await page.click('text=Membership');
    await page.click('button:has-text("Subscribe"):first');
    await page.click('input[value="wechat"]');
    await page.click('button:has-text("Confirm")');
    
    await page.waitForTimeout(2000);
    
    // Try second subscription
    await page.click('text=Membership');
    const subscribeButtons = page.locator('button:has-text("Subscribe")');
    
    // All subscribe buttons except current plan should be disabled or show different text
    await expect(subscribeButtons.first()).toHaveText(/Current Plan|Active/);
  });

  test('should handle payment failure gracefully', async () => {
    await page.click('text=Membership');
    await page.click('button:has-text("Subscribe"):first');
    
    // Select payment method
    await page.click('input[value="wechat"]');
    
    // Mock payment failure
    await page.evaluate(() => {
      (window as any).MOCK_PAYMENT_FAIL = true;
    });
    
    await page.click('button:has-text("Confirm")');
    
    await page.waitForTimeout(2000);
    
    // Verify error message
    await expect(page.locator('text=Payment Failed')).toBeVisible({ timeout: 10000 });
    
    // Verify user remains on free tier
    await expect(page.locator('text=Free User')).toBeVisible();
  });

  test('should display membership benefits on membership page', async () => {
    await page.click('text=Membership');
    
    // Verify benefits are listed
    await expect(page.locator('text=Ad-free experience')).toBeVisible();
    await expect(page.locator('text=point multiplier')).toBeVisible();
    await expect(page.locator('text=Priority access')).toBeVisible();
    await expect(page.locator('text=Cloud save')).toBeVisible();
  });

  test('should show membership expiration date', async () => {
    // Purchase membership
    await page.click('text=Membership');
    await page.click('button:has-text("Subscribe"):first');
    await page.click('input[value="wechat"]');
    await page.click('button:has-text("Confirm")');
    
    await page.waitForTimeout(2000);
    
    // Verify expiration date is displayed
    await expect(page.locator('text=Expires:')).toBeVisible();
    
    // Verify date format (should be a valid date)
    const expirationText = await page.locator('text=Expires:').textContent();
    expect(expirationText).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  test('should display auto-renew toggle', async () => {
    // Purchase membership
    await page.click('text=Membership');
    await page.click('button:has-text("Subscribe"):first');
    await page.click('input[value="wechat"]');
    await page.click('button:has-text("Confirm")');
    
    await page.waitForTimeout(2000);
    
    // Verify auto-renew toggle is displayed
    await expect(page.locator('text=Auto Renew')).toBeVisible();
    
    // Toggle auto-renew off
    await page.click('input[type="checkbox"]:near(text="Auto Renew")');
    
    // Verify state change
    const checkbox = page.locator('input[type="checkbox"]:near(text="Auto Renew")');
    await expect(checkbox).not.toBeChecked();
  });
});

