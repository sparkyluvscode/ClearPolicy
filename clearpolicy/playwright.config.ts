import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';

const hasAuthState = fs.existsSync('.auth/user.json');

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(hasAuthState
      ? [
          {
            name: 'chromium-authenticated',
            testIgnore: /auth-setup/,
            use: {
              ...devices['Desktop Chrome'],
              storageState: '.auth/user.json',
            },
          },
        ]
      : []),
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
});


