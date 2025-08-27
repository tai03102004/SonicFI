import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Basic reset styles
const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.5;
    color: #333;
    background-color: #f8fafc;
  }
  
  button {
    cursor: pointer;
  }
  
  button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  input, select, textarea {
    font-family: inherit;
  }
  
  a {
    color: inherit;
    text-decoration: none;
  }
`;

// Inject global styles
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
