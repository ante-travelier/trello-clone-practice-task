import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  outputDir: './test-results',
  webServer: [
    {
      // Inherits DATABASE_URL / NODE_ENV from the parent process (verify.mjs).
      // dotenv in the server does not override already-set env vars.
      command: 'cd ../server && npm run dev',
      port: 4000,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../client && npm run dev',
      port: 5173,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
