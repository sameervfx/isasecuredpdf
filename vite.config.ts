import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: 'mupdf-browser-stub',
      resolveId(id) {
        if (id === 'node:fs' || id === 'fs' || id === 'module') {
          return `\0virtual:${id}`;
        }
        return null;
      },
      load(id) {
        if (id.startsWith('\0virtual:')) {
          return 'export default {}; export const createRequire = () => () => ({});';
        }
        return null;
      },
    },
  ],
  base: '/',
  server: {
    port: 3005,
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
    commonjsOptions: {
      include: [/mupdf/, /node_modules/],
    },
    rollupOptions: {
      output: {
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'mupdf') {
            return 'assets/mupdf.js';
          }
          return 'assets/[name]-[hash].js';
        },
        // Chunk splitting for faster load and stable vendor URLs across deployments
        manualChunks: {
          'mupdf': ['mupdf'],
          'pdfjs': ['pdfjs-dist'],
          'pdflib': ['pdf-lib'],
          'react-core': ['react', 'react-dom'],
        },
      },
    },
  },
}));
