import { test, expect } from '@playwright/test';

const PROJECT_REF = 'qihsgnfjqmkjmoowyfbn';
const MOCK_SESSION = {
  access_token: 'fake-token',
  token_type: 'bearer',
  expires_in: 3600,
  user: { id: 'test-user-id', email: 'test@example.com' },
};

test.describe('Upload Flow', () => {
  test.beforeEach(async ({ context, page }) => {
    // Log browser console
    page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    
    // Log all requests
    page.on('request', request => {
      console.log(`REQUEST: ${request.method()} ${request.url()}`);
    });

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

    // Mock ALL REST
    await page.route('**/rest/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('humor_flavors')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 'flavor-1', slug: 'standard', description: 'Standard', is_pinned: true }]),
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
    });

    // PIPELINE STEP 1
    await page.route('**/pipeline/generate-presigned-url', async (route) => {
      console.log('MOCK STEP 1: Presigned URL');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ presignedUrl: 'https://mock-s3.com/put', cdnUrl: 'https://cdn.com/test.jpg' }),
      });
    });

    // PIPELINE STEP 2
    await page.route('https://mock-s3.com/put', async (route) => {
      console.log('MOCK STEP 2: S3 Upload');
      await route.fulfill({ status: 200 });
    });

    // PIPELINE STEP 3
    await page.route('**/pipeline/upload-image-from-url', async (route) => {
      console.log('MOCK STEP 3: Register');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ imageId: 'mock-img-id', timestamp: new Date().toISOString() }),
      });
    });

    // PIPELINE STEP 4
    await page.route('**/pipeline/generate-captions', async (route) => {
      console.log('MOCK STEP 4: Generate');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'c1', content: 'Mock Generated Caption', created_datetime_utc: new Date().toISOString() }
        ]),
      });
    });
  });

  test('Should complete upload and generation flow', async ({ page }) => {
    await page.goto('/');
    
    const uploadBtn = page.locator('button[title="Upload Image"]');
    await expect(uploadBtn).toBeVisible({ timeout: 15000 });
    await uploadBtn.click();
    
    await expect(page.locator('h2:has-text("Upload Image")')).toBeVisible({ timeout: 10000 });
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Click or drag to select an image').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-data'),
    });
    
    const generateBtn = page.locator('button:has-text("Upload & Generate")');
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();
    
    await expect(page.locator('text=Mock Generated Caption')).toBeVisible({ timeout: 25000 });
  });
});
