import { defineConfig, devices } from "@playwright/test";

// E2E against a production build (service worker only registers in production).
const PORT = 3017;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: { baseURL: BASE_URL },
  webServer: {
    command: `node_modules/.bin/next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
