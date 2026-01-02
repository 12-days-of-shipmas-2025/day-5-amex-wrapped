import { test, expect } from '@playwright/test';

test.describe('Dashboard - Full User Journey', () => {
  test('complete flow: landing -> demo data -> dashboard', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;

    // Step 1: Landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify landing page
    await expect(page.getByRole('heading', { name: /Amex.*Wrapped/i })).toBeVisible();

    // Take landing screenshot
    await page.screenshot({
      path: `e2e/screenshots/01-landing-${projectName}.png`,
      fullPage: true,
    });

    // Step 2: Click demo data button
    const demoButton = page.getByRole('button', { name: /Try with demo data/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // Step 3: Wait for dashboard to load
    await page.waitForTimeout(2000);
    await expect(page.getByText(/Net Spending/i).first()).toBeVisible({ timeout: 10000 });

    // Take dashboard hero screenshot
    await page.screenshot({
      path: `e2e/screenshots/02-dashboard-hero-${projectName}.png`,
      fullPage: false,
    });

    // Step 4: Verify dashboard header
    await expect(page.getByRole('heading', { name: /Your.*Amex.*Wrapped/i })).toBeVisible();
    const viewStoryButton = page.getByRole('button', { name: /View Story|Preparing/i });
    await expect(viewStoryButton).toBeVisible();

    // Step 5: Verify net spending section
    await expect(page.getByText(/Net Spending/i).first()).toBeVisible();
    await expect(page.getByText(/transactions/i).first()).toBeVisible();
    await expect(page.getByText(/Monthly Spending/i)).toBeVisible();

    // Step 6: Verify monthly chart is rendered
    const chartContainer = page.locator('.recharts-responsive-container').first();
    await expect(chartContainer).toBeVisible();

    // Step 7: Scroll to quick stats and verify
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);

    await expect(page.getByText(/Average Transaction/i)).toBeVisible();
    await expect(page.getByText(/Unique Merchants/i)).toBeVisible();

    // Take stats screenshot
    await page.screenshot({
      path: `e2e/screenshots/03-dashboard-stats-${projectName}.png`,
      fullPage: false,
    });

    // Step 8: Scroll to highlights section
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);

    // Check for biggest purchase or favourite merchant
    const hasBiggestPurchase = await page.getByText(/Biggest Single Purchase/i).isVisible();
    const hasFavouriteMerchant = await page.getByText(/Your Favourite Merchant/i).isVisible();
    expect(hasBiggestPurchase || hasFavouriteMerchant).toBeTruthy();

    // Take highlights screenshot
    await page.screenshot({
      path: `e2e/screenshots/04-dashboard-highlights-${projectName}.png`,
      fullPage: false,
    });

    // Step 9: Scroll to categories
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);

    const hasCategories = await page.getByText(/Spending by Category/i).isVisible();
    if (hasCategories) {
      await page.screenshot({
        path: `e2e/screenshots/05-dashboard-categories-${projectName}.png`,
        fullPage: false,
      });
    }

    // Step 10: Scroll to balance chart
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);

    await expect(page.getByText(/Balance Over Time/i)).toBeVisible();

    // Take balance chart screenshot
    await page.screenshot({
      path: `e2e/screenshots/06-dashboard-balance-${projectName}.png`,
      fullPage: false,
    });

    // Step 11: Scroll to transaction table
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);

    await expect(page.getByText(/All Transactions/i)).toBeVisible();

    // Take transactions screenshot
    await page.screenshot({
      path: `e2e/screenshots/07-dashboard-transactions-${projectName}.png`,
      fullPage: false,
    });

    // Step 12: Take full page screenshot
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `e2e/screenshots/08-dashboard-full-${projectName}.png`,
      fullPage: true,
    });
  });

  test('can clear data and return to landing', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;

    // Load demo data first
    await page.goto('/');
    await page.getByRole('button', { name: /Try with demo data/i }).click();
    await expect(page.getByText(/Net Spending/i).first()).toBeVisible({ timeout: 10000 });

    // Click clear button (has X icon, text is hidden on mobile)
    const clearButton = page.locator('button').filter({ has: page.locator('svg.lucide-x') });
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Should return to landing page
    await expect(page.getByRole('button', { name: /Try with demo data/i })).toBeVisible({
      timeout: 5000,
    });

    // Take screenshot
    await page.screenshot({
      path: `e2e/screenshots/09-cleared-landing-${projectName}.png`,
      fullPage: true,
    });
  });
});

test.describe('Dashboard - Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Load demo data
    await page.goto('/');
    await page.getByRole('button', { name: /Try with demo data/i }).click();
    await expect(page.getByText(/Net Spending/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('monthly chart displays peak month correctly', async ({ page }, testInfo) => {
    // Check peak month label exists and is visible
    const peakMonthLabel = page.getByText(/Peak Month/i);
    await expect(peakMonthLabel).toBeVisible();

    // Verify chart is rendered
    const chartArea = page.locator('.recharts-area');
    await expect(chartArea.first()).toBeVisible();

    // Take focused screenshot of chart area
    const chartSection = page.locator('.card-glass').first();
    await chartSection.screenshot({
      path: `e2e/screenshots/chart-monthly-${testInfo.project.name}.png`,
    });
  });

  test('stat cards display correctly', async ({ page }) => {
    // Scroll to stat cards
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);

    // Verify all stat cards
    await expect(page.getByText(/Average Transaction/i)).toBeVisible();
    await expect(page.getByText(/Unique Merchants/i)).toBeVisible();
    await expect(page.getByText(/Refunds Received/i)).toBeVisible();
  });

  test('transaction table is scrollable and functional', async ({ page }, testInfo) => {
    // Scroll to transaction table
    await page.getByText(/All Transactions/i).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Verify table exists
    await expect(page.getByText(/All Transactions/i)).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: `e2e/screenshots/table-transactions-${testInfo.project.name}.png`,
      fullPage: false,
    });
  });
});
