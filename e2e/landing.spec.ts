import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('displays all landing page elements correctly', async ({ page }, testInfo) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: /Amex.*Wrapped/i })).toBeVisible();

    // Check tagline
    await expect(page.getByText(/Your spending year in review/i)).toBeVisible();

    // Check file upload area
    await expect(page.getByText('Drop your statement')).toBeVisible();

    // Check demo data button
    await expect(page.getByRole('button', { name: /Try with demo data/i })).toBeVisible();

    // Check privacy notice
    await expect(page.getByText(/100% private/i)).toBeVisible();

    // Check how to get CSV instructions
    await expect(page.getByText(/how to get csv/i)).toBeVisible();

    // Check chat button
    const chatButton = page.getByRole('link', { name: /Chat with us/i });
    await expect(chatButton).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: `e2e/screenshots/landing-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test('chat button is positioned correctly', async ({ page }) => {
    const chatButton = page.getByRole('link', { name: /Chat with us/i });
    await expect(chatButton).toBeVisible();
    await expect(chatButton).toHaveAttribute('href', /humanwritten\.ai\?chat=open/);
    await expect(chatButton).toHaveAttribute('target', '_blank');

    // Check position (should be in bottom right)
    const box = await chatButton.boundingBox();
    const viewport = page.viewportSize();
    expect(box).toBeTruthy();
    if (box && viewport) {
      expect(box.x + box.width / 2).toBeGreaterThan(viewport.width / 2);
      expect(box.y).toBeGreaterThan(viewport.height * 0.7);
    }
  });

  test('file upload dropzone is interactive', async ({ page }) => {
    const dropzone = page.getByText('Drop your statement').locator('..');
    await expect(dropzone).toBeVisible();
    await dropzone.hover();
    await expect(dropzone).toBeEnabled();
  });
});
