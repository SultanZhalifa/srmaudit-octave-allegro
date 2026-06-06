import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Vite configuration. The app is a static SPA; env vars prefixed with
// VITE_ are exposed to the client (see .env.example).
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@supabase/supabase-js'],
          charts: ['chart.js'],
          pdf: ['jspdf'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
