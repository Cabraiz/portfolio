import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: '**/labels.spec.ts',
  webServer: {
    ...base.webServer!,
    command: 'npx vite --host 127.0.0.1 --port 4174 --strictPort',
  },
});
