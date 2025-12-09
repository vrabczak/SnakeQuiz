import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

if ('serviceWorker' in navigator) {
  /**
   * Registers the service worker after the window load event to enable offline play.
   */
  const registerServiceWorker = () => {
    navigator.serviceWorker.register('/SnakeQuiz/sw.js').catch((error) => {
      console.error('Service worker registration failed', error);
    });
  };

  window.addEventListener('load', () => {
    registerServiceWorker();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
