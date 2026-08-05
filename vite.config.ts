import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use '/' base for web/Vercel deployments, './' only for Electron standalone
  base: process.env.ELECTRON_BUILD === 'true' ? './' : '/',
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    open: false,
  },
  optimizeDeps: {
    include: ['pdf-lib', 'pdfjs-dist'],
  },
  build: {
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
