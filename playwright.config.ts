import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './src/constants/urls.js';

export default defineConfig({
  testDir: './src',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});