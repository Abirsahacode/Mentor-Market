import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Keep Vite's disposable cache outside node_modules so a previous
  // elevated npm install cannot prevent the local development server starting.
  cacheDir: ".vite-cache",
  server: { port: 5173, strictPort: true },
});
