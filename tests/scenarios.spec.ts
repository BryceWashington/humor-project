import { test, expect } from '@playwright/test';

const PROJECT_REF = 'qihsgnfjqmkjmoowyfbn';
const COOKIE_NAMES = [
  `sb-${PROJECT_REF}-auth-token`,
  'sb-auth-token',
];

test.describe('Authenticated Scenarios', () => {
  test.beforeEach(async ({ context, page }) => {
    const mockSession = {
      access_token: 'fake-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'fake-refresh-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    const sessionString = JSON.stringify(mockSession);

    await page.addInitScript((s) => {
      // @ts-ignore
      window.__TEST_SESSION__ = JSON.parse(s);
    }, sessionString);

    await context.addCookies(COOKIE_NAMES.map(name => ({
      name: name,
      value: sessionString,
      domain: 'localhost',
      path: '/',
    })));

    // Broad mocks
    await page.route('**/auth/v1/**', async (route) => {
      const url = route.request().url();
      console.log('MOCK AUTH:', url);
      await route.fulfill({ status: 200, contentType: 'application/json', body: sessionString });
    });

    await page.route('**/rest/v1/**', async (route) => {
      const url = route.request().url();
      console.log('MOCK REST:', url);
      
      if (url.includes('captions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'caption-1',
            content: 'Mock Caption 1',
            created_datetime_utc: new Date().toISOString(),
            profiles: { id: 'user-1', email: 'user1@example.com' },
            images: { id: 'img-1', url: 'https://via.placeholder.com/450' }
          }]),
        });
      } else if (url.includes('caption_votes')) {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        } else {
          await route.fulfill({ status: 201 });
        }
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });
  });

  test('Should show Upload button when logged in', async ({ page }) => {
    await page.goto('/');
    const uploadBtn = page.locator('button[title="Upload Image"]');
    await expect(uploadBtn).toBeVisible({ timeout: 15000 });
  });

  test('Should allow upvoting when logged in', async ({ page }) => {
    await page.goto('/');
    const upvoteBtn = page.locator('.flex.flex-col.items-center.w-12 button').first();
    await expect(upvoteBtn).toBeVisible({ timeout: 15000 });
    
    const score = page.locator('.flex.flex-col.items-center.w-12 span').first();
    const initialText = await score.innerText();
    
    await upvoteBtn.click();
    const newScore = parseInt(initialText) + 1;
    await expect(score).toHaveText(newScore.toString());
  });
});
