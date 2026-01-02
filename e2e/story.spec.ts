import { test, expect } from '@playwright/test';

test.describe('Story Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Load demo data first
    await page.goto('/');
    await page.getByRole('button', { name: /Try with demo data/i }).click();
    await expect(page.getByText(/Net Spending/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('full story journey: open -> navigate -> close', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;

    // Step 1: Click View Story button
    const viewStoryButton = page.getByRole('button', { name: /View Story|Preparing/i });
    await expect(viewStoryButton).toBeVisible();
    await viewStoryButton.click();

    // Step 2: Should see intro screen with year and play button
    await expect(page.getByText(/Your Year with Amex/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Tap to begin your journey/i)).toBeVisible();

    // Take intro screenshot
    await page.screenshot({
      path: `e2e/screenshots/story-01-intro-${projectName}.png`,
      fullPage: false,
    });

    // Step 3: Click play button to start
    const playButton = page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-play') })
      .first();
    await expect(playButton).toBeVisible();
    await playButton.click();

    // Step 4: Should see first slide content
    await page.waitForTimeout(500);

    // Pause auto-play for manual navigation
    const pauseButton = page.locator('button').filter({ has: page.locator('svg.lucide-pause') });
    if (await pauseButton.isVisible()) {
      await pauseButton.click();
      await page.waitForTimeout(300);
    }

    // Take first slide screenshot
    await page.screenshot({
      path: `e2e/screenshots/story-02-slide1-${projectName}.png`,
      fullPage: false,
    });

    // Step 5: Navigate through several slides manually using next button
    const nextButton = page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-chevron-right') });

    // Go to slide 2 (total spent) - may need multiple clicks if still on intro
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Retry click if we're still on the first slide
    const totalSpentText = page.getByText(/This year, you spent/i);
    if (!(await totalSpentText.isVisible())) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }
    await expect(totalSpentText).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: `e2e/screenshots/story-03-total-spent-${projectName}.png`,
      fullPage: false,
    });

    // Go to slide 3 (monthly chart)
    await nextButton.click();
    await page.waitForTimeout(800);
    await expect(page.getByText(/Your spending journey/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `e2e/screenshots/story-04-monthly-${projectName}.png`,
      fullPage: false,
    });

    // Go to slide 4 (biggest purchase)
    await nextButton.click();
    await page.waitForTimeout(800);
    await expect(page.getByText(/Your biggest splurge/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `e2e/screenshots/story-05-splurge-${projectName}.png`,
      fullPage: false,
    });

    // Go to slide 5 (favorite merchant)
    await nextButton.click();
    await page.waitForTimeout(800);
    await expect(page.getByText(/Your favourite place/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `e2e/screenshots/story-06-favourite-${projectName}.png`,
      fullPage: false,
    });

    // Step 6: Test previous button
    const prevButton = page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-chevron-left') });
    await prevButton.click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/Your biggest splurge/i)).toBeVisible();

    // Step 7: Navigate to end slides
    for (let i = 0; i < 8; i++) {
      await nextButton.click();
      await page.waitForTimeout(400);
    }

    // Should be at or near outro
    await page.screenshot({
      path: `e2e/screenshots/story-07-near-end-${projectName}.png`,
      fullPage: false,
    });

    // Step 8: Close story mode
    const closeButton = page.locator('button').filter({ has: page.locator('svg.lucide-x') });
    await closeButton.click();

    // Should return to dashboard
    await expect(page.getByText(/Net Spending/i).first()).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `e2e/screenshots/story-08-returned-${projectName}.png`,
      fullPage: false,
    });
  });

  test('story mode progress dots navigation', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;

    // Open story mode
    await page.getByRole('button', { name: /View Story|Preparing/i }).click();
    await expect(page.getByText(/Your Year with Amex/i)).toBeVisible({ timeout: 5000 });

    // Start the experience
    const playButton = page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-play') })
      .first();
    await playButton.click();
    await page.waitForTimeout(1000);

    // Click on a progress dot to jump to a different slide
    const progressDots = page.locator('.flex.gap-2 > button');
    const dotCount = await progressDots.count();
    expect(dotCount).toBeGreaterThan(5);

    // Jump to middle slide using progress dot
    const middleDot = progressDots.nth(Math.floor(dotCount / 2));
    await middleDot.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `e2e/screenshots/story-dots-jump-${projectName}.png`,
      fullPage: false,
    });

    // Close
    await page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-x') })
      .click();
    await expect(page.getByText(/Net Spending/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('story mode pause/play toggle', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;

    // Open story mode
    await page.getByRole('button', { name: /View Story|Preparing/i }).click();
    await expect(page.getByText(/Your Year with Amex/i)).toBeVisible({ timeout: 5000 });

    // Start the experience
    const playButton = page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-play') })
      .first();
    await playButton.click();
    await page.waitForTimeout(1000);

    // Auto-play should be active (pause button visible at top left)
    const pauseButton = page.locator('button').filter({ has: page.locator('svg.lucide-pause') });
    await expect(pauseButton).toBeVisible();

    // Click pause
    await pauseButton.click();
    await page.waitForTimeout(300);

    // Now play button should be visible instead
    const playButtonTopLeft = page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-play') });
    await expect(playButtonTopLeft.first()).toBeVisible();

    await page.screenshot({
      path: `e2e/screenshots/story-paused-${projectName}.png`,
      fullPage: false,
    });

    // Close
    await page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-x') })
      .click();
    await expect(page.getByText(/Net Spending/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('story mode keyboard navigation', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;

    // Open story mode
    await page.getByRole('button', { name: /View Story|Preparing/i }).click();
    await expect(page.getByText(/Your Year with Amex/i)).toBeVisible({ timeout: 5000 });

    // Start the experience
    const playButton = page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-play') })
      .first();
    await playButton.click();
    await page.waitForTimeout(1000);

    // Navigate with arrow keys
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await expect(page.getByText(/This year, you spent/i)).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await expect(page.getByText(/Your spending journey/i)).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);
    await expect(page.getByText(/This year, you spent/i)).toBeVisible();

    await page.screenshot({
      path: `e2e/screenshots/story-keyboard-nav-${projectName}.png`,
      fullPage: false,
    });

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByText(/Net Spending/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('story mode auto-play advances slides', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;

    // Open story mode
    await page.getByRole('button', { name: /View Story|Preparing/i }).click();
    await expect(page.getByText(/Your Year with Amex/i)).toBeVisible({ timeout: 5000 });

    // Start the experience
    const playButton = page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-play') })
      .first();
    await playButton.click();

    // Wait for auto-play to advance to the next slide (3 seconds per slide + buffer)
    await page.waitForTimeout(4000);

    // Should have advanced past the first slide - check we're not still on intro year
    // The second slide shows "This year, you spent" text
    await expect(page.getByText(/This year, you spent/i)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `e2e/screenshots/story-auto-play-${projectName}.png`,
      fullPage: false,
    });

    // Close
    await page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-x') })
      .click();
    await expect(page.getByText(/Net Spending/i).first()).toBeVisible({ timeout: 5000 });
  });
});
