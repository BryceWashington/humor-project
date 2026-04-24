import { test, expect } from '@playwright/test';

const PROJECT_REF = 'qihsgnfjqmkjmoowyfbn';
const MOCK_SESSION = {
  access_token: 'fake-token',
  token_type: 'bearer',
  expires_in: 3600,
  user: { id: 'test-user-id', email: 'test@example.com' },
};

test.describe('Profile Page', () => {
  test.beforeEach(async ({ context, page }) => {
    const sessionString = JSON.stringify(MOCK_SESSION);
    
    await page.addInitScript((s) => {
      // @ts-ignore
      window.__TEST_SESSION__ = JSON.parse(s);
    }, sessionString);

    await context.addCookies([{
      name: `sb-${PROJECT_REF}-auth-token`,
      value: sessionString,
      domain: 'localhost',
      path: '/',
    }]);

    // Mock history
    await page.route('**/rest/v1/caption_votes*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            caption_id: 'caption-1',
            vote_value: 1,
            captions: {
              id: 'caption-1',
              content: 'History Caption 1',
              created_datetime_utc: new Date().toISOString(),
              profiles: { email: 'test@example.com' },
              images: { url: 'https://via.placeholder.com/450' }
            }
          }
        ]),
      });
    });

    // Mock images
    await page.route('**/rest/v1/images*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'img-1',
            url: 'https://via.placeholder.com/450',
            created_datetime_utc: new Date().toISOString(),
          }
        ]),
      });
    });
  });

  test('Should navigate to profile and switch tabs', async ({ page }) => {
    await page.goto('/');
    
    // Ensure we are logged in before clicking
    await expect(page.locator('button[title="Upload Image"]')).toBeVisible();
    
    const profileLink = page.locator('a:has-text("Profile")');
    await profileLink.click();
    
    // Wait for the URL and content
    await page.waitForURL('**/protected');
    await expect(page.locator('text=History Caption 1')).toBeVisible({ timeout: 10000 });
    
    const uploadTab = page.locator('button:has-text("Uploaded Images")');
    await uploadTab.click();
    
    await expect(page.locator('img').first()).toBeVisible();
  });
});
