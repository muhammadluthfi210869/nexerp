import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Global Error Handler for "Genius" debugging
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 2rem; background: #FEF2F2; color: #DC2626; font-family: monospace; border: 2px solid #DC2626; border-radius: 12px; margin: 2rem;">
        <h2 style="margin: 0 0 1rem 0;">AUREON ERP: BOOT FAILURE</h2>
        <p><strong>Error:</strong> ${message}</p>
        <p><strong>Source:</strong> ${source}:${lineno}:${colno}</p>
        <pre style="margin-top: 1rem; background: #FFF; padding: 1rem; border-radius: 4px;">${error?.stack || 'No stack trace available'}</pre>
        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 8px 16px; background: #DC2626; color: white; border: none; border-radius: 6px; cursor: pointer;">RELOAD ENGINE</button>
      </div>
    `;
  }
  return false;
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  console.error("Critical Failure: #root element not found in DOM.");
}
