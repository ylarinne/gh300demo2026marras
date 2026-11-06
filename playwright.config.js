import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./client/e2e",
  use: { baseURL: process.env.CLIENT_URL ?? "http://127.0.0.1:5173" },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ]
});