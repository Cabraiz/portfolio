import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  base: isProd ? "" : "/",
  plugins: [react(), tsconfigPaths()],
  build: {
    sourcemap: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});
