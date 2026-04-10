import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// ── Modo oscuro automático según preferencia del sistema ────────────────────
const applyDarkMode = (dark) => {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
applyDarkMode(darkQuery.matches);
darkQuery.addEventListener('change', (e) => applyDarkMode(e.matches));
// ───────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
