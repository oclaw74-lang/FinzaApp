import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 1,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost',
    headless: true,
    screenshot: 'on',
    video: 'off',
    trace: 'off',
    viewport: { width: 1280, height: 800 },
  },
  outputDir: './test-results',
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
