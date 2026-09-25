import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";

export default defineConfig({
  ...base,
  testMatch: "**/google-auth.spec.js",
  testIgnore: [],
  webServer: base.webServer.map((server, index) =>
    index === 1
      ? {
          ...server,
          env: {
            ...server.env,
            VITE_SUPABASE_URL: "https://campusdesk-auth.example",
            VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_test_only",
          },
        }
      : server,
  ),
});
