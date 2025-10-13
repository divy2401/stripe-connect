import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-query", "axios"],
  },
  build: {
    target: "esnext",
    minify: "esbuild",
  },
});
