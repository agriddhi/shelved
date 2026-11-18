import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './polish.css';
import App from './App.jsx';
import { ToastProvider } from './components/Extras.jsx';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    /* offline shell optional — app still works */
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);
