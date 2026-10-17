import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: '/admin',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "../node_modules/react"),
      "react-dom": path.resolve(__dirname, "../node_modules/react-dom"),
      "@tanstack/react-query": path.resolve(__dirname, "../node_modules/@tanstack/react-query"),
      "@supabase/supabase-js": path.resolve(__dirname, "../node_modules/@supabase/supabase-js"),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-query"],
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
  optimizeDeps: {
    include: [
      "@tanstack/react-query",
      "@tanstack/react-query-devtools",
      "@supabase/supabase-js"
    ],
  },
  build: {
    commonjsOptions: {
      include: [/shared/, /node_modules/],
    },
  },
});
