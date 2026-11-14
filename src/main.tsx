import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global resilience handler to catch benign scanner lifecycle race conditions
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg =
      typeof event.message === 'string'
        ? event.message
        : event.error instanceof Error
        ? event.error.message
        : String(event.error || '');
    if (msg.includes('Cannot stop, scanner is not running or paused')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg =
      typeof reason === 'string'
        ? reason
        : reason instanceof Error
        ? reason.message
        : String(reason || '');
    if (msg.includes('Cannot stop, scanner is not running or paused')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);

// Register Service Worker for offline PWA caching & mobile home screen installation
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration notice:', err);
    });
  });
}
