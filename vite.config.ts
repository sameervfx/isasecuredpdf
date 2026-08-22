import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    open: false,
  },
  optimizeDeps: {
    include: ['pdf-lib', 'pdfjs-dist', 'mupdf'],
    esbuildOptions: {
      target: 'esnext',
      supported: { 'top-level-await': true },
    },
  },
  esbuild: {
    target: 'esnext',
    supported: { 'top-level-await': true },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Chunk splitting for faster load
        manualChunks: {
          'pdfjs': ['pdfjs-dist'],
          'pdflib': ['pdf-lib'],
          'react-core': ['react', 'react-dom'],
        },
      },
    },
  },
}));
