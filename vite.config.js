import react from "@vitejs/plugin-react-swc";
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
    host: true, // 🔥 libera acesso via IP local, ex: 192.168.0.5:5173
    port: 5173, // (opcional) mantém a porta padrão
  },
});
