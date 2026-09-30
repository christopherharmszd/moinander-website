import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  base: process.env.PAGES_BASE_PATH ? `${process.env.PAGES_BASE_PATH.replace(/\/$/, "")}/` : "/",
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: ["index.html", "verein/index.html", "projekte/index.html", "termine/index.html", "partner/index.html", "mitmachen/index.html", "kontakt/index.html", "studio/index.html"].map((file) => resolve(import.meta.dirname, file)),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});
