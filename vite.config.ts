import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  // ✅ Vercel では "/" にする（GitHub Pages用の "/-/" は使わない）
  base: "/",

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },

  // ✅ Vite のルートは client
  root: path.resolve(import.meta.dirname, "client"),

  // ✅ 出力はリポジトリ直下 dist（Vercelの Output Directory を dist に）
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },

  server: {
    port: 3000,
    host: true,
  },
});
