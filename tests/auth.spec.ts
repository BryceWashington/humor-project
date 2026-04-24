import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('Should show Sign in with Google on the home page', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.getByRole('button', { name: /Sign in with Google/i });
    await expect(loginBtn).toBeVisible();
  });
});
