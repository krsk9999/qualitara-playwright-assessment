import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Local runs read .env; CI provides the same variables from repository secrets.
if (existsSync('.env')) process.loadEnvFile('.env');

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 3 : 0,
  timeout: 300_000,
  expect: {
    timeout: 60_000,
  },
  // Challenge requirement: never run more than 3 workers in CI.
  workers: isCI ? 4 : undefined,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://the-internet.herokuapp.com',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    headless: false,
    actionTimeout: 10_000,
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
