import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const pageRoot = fileURLToPath(new URL('./src/page', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': pageRoot,
    },
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [['**/*.test.jsx', 'jsdom']],
    setupFiles: ['./tests/setup.jsdom.js'],
  },
});
