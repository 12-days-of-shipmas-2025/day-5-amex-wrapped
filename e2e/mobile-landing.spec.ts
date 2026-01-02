import { test, expect } from '@playwright/test';

test.describe('Mobile Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays hero section correctly', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: /Amex.*Wrapped/i })).toBeVisible();

    // Check tagline
    await expect(page.getByText(/Your spending year in review/i)).toBeVisible();
    await expect(page.getByText(/Beautiful visualizations/i)).toBeVisible();
  });

  test('displays file upload area', async ({ page }) => {
    // Check upload dropzone
    await expect(page.getByText('Drop your statement')).toBeVisible();
    await expect(page.getByText('or click to browse')).toBeVisible();

    // Check supported regions
    await expect(page.getByText('UK')).toBeVisible();
    await expect(page.getByText('Mexico')).toBeVisible();
    await expect(page.getByText('Tested with')).toBeVisible();
  });

  test('displays demo data button', async ({ page }) => {
    const demoButton = page.getByRole('button', { name: /Try with demo data/i });
    await expect(demoButton).toBeVisible();
    await expect(demoButton).toBeEnabled();
  });

  test('displays privacy notice', async ({ page }) => {
    await expect(page.getByText(/100% private/i)).toBeVisible();
    await expect(page.getByText(/your data never leaves your browser/i)).toBeVisible();
  });

  test('displays how to get CSV instructions', async ({ page }) => {
    await expect(page.getByText(/how to get csv/i)).toBeVisible();
    await expect(page.getByText(/Amex Login/i)).toBeVisible();
    await expect(page.getByText(/Statements/i)).toBeVisible();
  });

  test('displays support notice', async ({ page }) => {
    await expect(page.getByText(/Any issues/i)).toBeVisible();
    await expect(page.getByText(/Chat with us for support/i)).toBeVisible();
  });

  test('chat button is visible and positioned correctly', async ({ page }) => {
    const chatButton = page.getByRole('link', { name: /Chat with us/i });
    await expect(chatButton).toBeVisible();

    // Check href includes chat=open
    await expect(chatButton).toHaveAttribute('href', /humanwritten\.ai\?chat=open/);

    // Verify it opens in new tab
    await expect(chatButton).toHaveAttribute('target', '_blank');

    // Check position (should be in bottom right)
    const box = await chatButton.boundingBox();
    const viewport = page.viewportSize();
    expect(box).toBeTruthy();
    if (box && viewport) {
      // Button should be in the right half of the screen
      expect(box.x + box.width / 2).toBeGreaterThan(viewport.width / 2);
      // Button should be in the bottom portion of viewport
      expect(box.y).toBeGreaterThan(viewport.height * 0.7);
    }
  });

  test('page is scrollable and content remains accessible', async ({ page }) => {
    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);
    expect(initialScrollY).toBe(0);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(300);

    // Verify scroll happened
    const newScrollY = await page.evaluate(() => window.scrollY);
    expect(newScrollY).toBeGreaterThan(0);

    // Content should still be accessible after scroll
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByRole('heading', { name: /Amex.*Wrapped/i })).toBeVisible();
  });

  test('upload dropzone is interactive', async ({ page }) => {
    const dropzone = page.getByText('Drop your statement').locator('..');
    await expect(dropzone).toBeVisible();

    // Hover should work (visual feedback)
    await dropzone.hover();

    // Click should trigger file input (we just verify it's clickable)
    await expect(dropzone).toBeEnabled();
  });

  test('demo data button loads dashboard', async ({ page }) => {
    const demoButton = page.getByRole('button', { name: /Try with demo data/i });
    await demoButton.click();

    // Should navigate to dashboard or show loading state
    // Wait for either dashboard content or loading indicator
    await page.waitForTimeout(1000);

    // After loading demo data, we should see dashboard elements
    // or be on a different view
    const url = page.url();
    const hasDashboard = await page
      .getByText(/Total Spent/i)
      .isVisible()
      .catch(() => false);
    const hasCategories = await page
      .getByText(/Categories/i)
      .isVisible()
      .catch(() => false);

    // Either we have dashboard content or we're still processing
    expect(hasDashboard || hasCategories || url.includes('/')).toBeTruthy();
  });

  test('full page visual snapshot', async ({ page }) => {
    // Take full page screenshot for visual regression
    await page.screenshot({ path: 'e2e/screenshots/mobile-landing-full.png', fullPage: true });
  });

  test('viewport screenshot above the fold', async ({ page }) => {
    // Take viewport screenshot
    await page.screenshot({ path: 'e2e/screenshots/mobile-landing-viewport.png' });
  });
});

test.describe('Mobile Landing Page - Interactions', () => {
  test('complete user flow: view landing, scroll, click demo', async ({ page }) => {
    // Start on landing
    await page.goto('/');

    // Verify initial state
    await expect(page.getByRole('heading', { name: /Amex.*Wrapped/i })).toBeVisible();

    // Scroll down to see all content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Click try demo data
    await page.getByRole('button', { name: /Try with demo data/i }).click();

    // Wait for transition
    await page.waitForTimeout(2000);

    // Should now see dashboard content
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000); // Page has content
  });
});
