import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: "list",
  webServer: [
    {
      command: "node ../backend/tests/serve.js",
      url: "http://127.0.0.1:5101",
      timeout: 60000,
      reuseExistingServer: process.env.CCMS_REUSE_TEST_API === "true",
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
      url: "http://127.0.0.1:4173",
      env: {
        VITE_API_URL: "http://127.0.0.1:5101/api",
        VITE_SUPABASE_URL: "",
        VITE_SUPABASE_PUBLISHABLE_KEY: "",
      },
      timeout: 60000,
      reuseExistingServer: false,
    },
  ],
});
