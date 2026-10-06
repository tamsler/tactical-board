/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // The app, plus the standalone "Create drills with AI" guide at /ai/.
      input: { main: "index.html", ai: "ai/index.html" },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});
