// vite.config.js
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const pageRoot = fileURLToPath(new URL('./src/page', import.meta.url));

export default defineConfig({
  root: 'src/page',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': pageRoot,
    },
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
});
