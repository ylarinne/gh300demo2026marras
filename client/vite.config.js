import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const proxy = {
  "/api": { target: `http://127.0.0.1:${process.env.API_PORT ?? 3001}` }
};

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
  test: {
    include: ["src/**/*.test.{js,jsx}"],
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"]
  }
});