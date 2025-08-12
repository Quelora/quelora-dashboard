// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/css/index.css';
import './i18n';

// Silencia algunos warnings molestos en desarrollo

const originalError = console.error;
console.error = (msg, ...args) => {
  if (
    typeof msg === 'string' &&
    (
      msg.includes('defaultProps') ||
      msg.includes('React Router Future Flag') ||
      msg.includes('Warning: XAxis') ||
      msg.includes('Warning: YAxis')
    )
  ) return;
  originalError(msg, ...args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);