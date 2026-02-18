import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  base: "/-/",

  // ✅ アプリ本体は client
  root: path.resolve(import.meta.dirname, "client"),

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },

  build: {
    // ✅ 出力はリポジトリ直下 dist（Vercelの Output Directory=dist と一致）
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },

  server: {
    port: 3000,
    host: true,
  },
});
