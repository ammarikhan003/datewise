import { defineConfig, devices } from '@playwright/test';

// Captures the README screenshots; not part of the test run.
//   docker compose --profile e2e run --rm -v ./docs/screenshots:/screenshots e2e \
//     sh -c "npm ci && npx playwright test -c screenshots.config.ts"
export default defineConfig({
  testDir: './screenshots',
  globalSetup: './global-setup.ts',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env['BASE_URL'] ?? 'http://localhost:4200',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
  },
});
