// filepath: /Users/macbookpro14m1pro/Desktop/SocialFi/frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  define: {
    global: "globalThis",
  },
});
