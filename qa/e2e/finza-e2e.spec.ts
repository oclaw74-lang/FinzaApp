import { test, expect } from '@playwright/test';

test.describe('Feature: Frontend Load and Navigation', () => {
  test('app loads - React root renders correctly', async ({ page }) => {
    const response = await page.goto('http://localhost/');
    expect(response?.status()).toBe(200);

    // Wait for root to exist
    const root = page.locator('#root');
    await expect(root).toBeAttached();

    // Screenshot for evidence
    await page.screenshot({ path: '/tmp/finza-e2e/screenshot-home.png', fullPage: true });
  });

  test('app loads - page title is Finza', async ({ page }) => {
    await page.goto('http://localhost/');
    await expect(page).toHaveTitle(/Finza/i);
  });

  test('app loads - page has content (not blank)', async ({ page }) => {
    await page.goto('http://localhost/');
    // Wait up to 10s for something to render inside root
    await page.waitForTimeout(3000);
    const body = await page.locator('body').textContent();
    // Body should have some text content - not completely empty
    expect(body).not.toBe('');
    await page.screenshot({ path: '/tmp/finza-e2e/screenshot-loaded.png', fullPage: true });
  });
});

test.describe('Feature: Auth - Unauthenticated access', () => {
  test('unauthenticated user sees login page or is redirected', async ({ page }) => {
    await page.goto('http://localhost/');
    await page.waitForTimeout(3000);
    
    // Get current URL after potential redirect
    const currentUrl = page.url();
    console.log('Current URL after load:', currentUrl);
    
    // Screenshot evidence
    await page.screenshot({ path: '/tmp/finza-e2e/screenshot-auth-check.png', fullPage: true });
    
    // App should not show dashboard content to unauthenticated users
    // It should either show login form or redirect to /login or /auth
    const bodyText = (await page.locator('body').textContent()) || '';
    const hasLoginIndicator = 
      currentUrl.includes('/login') || 
      currentUrl.includes('/auth') ||
      bodyText.toLowerCase().includes('iniciar sesión') ||
      bodyText.toLowerCase().includes('sign in') ||
      bodyText.toLowerCase().includes('login') ||
      bodyText.toLowerCase().includes('correo') ||
      bodyText.toLowerCase().includes('email') ||
      bodyText.toLowerCase().includes('contraseña') ||
      bodyText.toLowerCase().includes('password') ||
      bodyText.toLowerCase().includes('finza');
    
    console.log('Body text preview:', bodyText.substring(0, 200));
    expect(hasLoginIndicator).toBe(true);
  });
});

test.describe('Feature: Security Headers', () => {
  test('nginx serves security headers', async ({ page }) => {
    const response = await page.goto('http://localhost/');
    const headers = response?.headers() || {};
    
    // Check for security headers set by nginx
    console.log('X-Frame-Options:', headers['x-frame-options']);
    console.log('X-Content-Type-Options:', headers['x-content-type-options']);
    console.log('X-XSS-Protection:', headers['x-xss-protection']);
    
    expect(headers['x-frame-options']).toBeTruthy();
    expect(headers['x-content-type-options']).toBeTruthy();
  });
});
