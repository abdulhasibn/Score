import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * 
 * Scope: Infrastructure setup only - ready for Auth E2E tests
 * Browser: Chromium only (single browser for deterministic testing)
 * 
 * Assumptions:
 * - App runs on http://localhost:3000 (default Next.js dev server)
 * - No webServer coupling (tests assume server is already running)
 * - Environment variables loaded from .env.e2e via dotenv
 */
export default defineConfig({
  testDir: './e2e',
  
  fullyParallel: true,
  
  forbidOnly: !!process.env.CI,
  
  retries: process.env.CI ? 2 : 0,
  
  workers: process.env.CI ? 1 : undefined,
  
  reporter: 'html',
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: undefined,
});
