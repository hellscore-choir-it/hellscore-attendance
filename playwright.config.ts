import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3005",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev --port 3005",
    port: 3005,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      E2E_TEST_MODE: "true",
      NEXT_PUBLIC_E2E_TEST_MODE: "true",
      SKIP_ENV_VALIDATION: "true",
      NODE_ENV: process.env.NODE_ENV ?? "development",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
