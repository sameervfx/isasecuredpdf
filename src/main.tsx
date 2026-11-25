import './utils/canvasOptimization';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import './utils/pdfMetadata';

// Auto-recover if a live deployment updated Vite chunk hashes while a browser tab stayed open
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    const key = 'isa_chunk_reload_at';
    const last = Number(sessionStorage.getItem(key) || '0');
    if (Date.now() - last > 10000) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.reload();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
