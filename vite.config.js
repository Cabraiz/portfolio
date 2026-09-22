import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  /**
   * Defina VITE_PUBLIC_BASE no ambiente quando precisar publicar em subcaminho.
   *
   * Exemplos:
   * - Custom domain ou user site: VITE_PUBLIC_BASE=/
   * - Project Pages: VITE_PUBLIC_BASE=/portfolio/
   */
  const base = env.VITE_PUBLIC_BASE || "/";

  return {
    base,
    plugins: [react()],
    resolve: {
      tsconfigPaths: true,
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      sourcemap: true,
    },
    server: {
      host: true,
      port: 5173,
    },
  };
});
