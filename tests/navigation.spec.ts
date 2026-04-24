import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('Should display logo and navigate to home', async ({ page }) => {
    await page.goto('/');
    const logo = page.locator('text=Humor Social').first();
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL('/');
  });

  test('Should show login button for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.getByRole('button', { name: /Sign in with Google/i });
    await expect(loginBtn).toBeVisible();
  });
});
