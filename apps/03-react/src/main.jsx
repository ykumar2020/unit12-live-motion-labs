import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './shared/style.css';
import { installShell } from './shared/lab.js';
installShell(3);
createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
