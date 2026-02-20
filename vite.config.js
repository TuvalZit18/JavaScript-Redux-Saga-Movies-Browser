/**
 * Vite Configuration
 *
 * Vite is the build tool and dev server for this project.
 * @vitejs/plugin-react enables React JSX transform and Fast Refresh
 * (hot module replacement during development — changes appear instantly
 * without losing component state).
 *
 * To start the dev server: npm run dev
 * To build for production: npm run build
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
