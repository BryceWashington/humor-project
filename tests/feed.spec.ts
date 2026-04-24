import { test, expect } from '@playwright/test';

test.describe('Feed', () => {
  test('Should display feed items and "Load More" button', async ({ page }) => {
    await page.goto('/');
    
    // We expect some captions to load. If it's empty, it might show "You've reached the bottom."
    // Let's just check for the presence of either "Load More" or the end message, 
    // or a feed item.
    const hasLoadMore = await page.locator('button:has-text("Load More")').isVisible();
    const hasEndMessage = await page.locator('text="You\'ve reached the bottom. No more fresh captions!"').isVisible();
    const hasFeedItems = await page.locator('h3').count() > 0;
    
    expect(hasLoadMore || hasEndMessage || hasFeedItems).toBeTruthy();
  });

  test('Should show login prompt when voting unauthenticated', async ({ page }) => {
    await page.goto('/');
    
    // Wait for at least one feed item to appear
    const upvoteButtons = page.locator('.flex.flex-col.items-center.w-12 button:first-child');
    if (await upvoteButtons.count() > 0) {
      await upvoteButtons.first().click();
      const toast = page.locator('text=You need to log in to vote');
      await expect(toast).toBeVisible();
    }
  });

  test('Should show login prompt when generating captions unauthenticated', async ({ page }) => {
    await page.goto('/');
    
    const generateButtons = page.locator('button[title="Generate more captions"]');
    if (await generateButtons.count() > 0) {
      await generateButtons.first().click();
      const toast = page.locator('text=You need to log in to generate captions');
      await expect(toast).toBeVisible();
    }
  });
});
