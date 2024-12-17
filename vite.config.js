import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  base: isProd ? '' : '', // Ajuste o basePath conforme o ambiente
  plugins: [react(), tsconfigPaths()],
  build: {
    sourcemap: true,
  },
});
