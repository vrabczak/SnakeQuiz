import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import './styles.css';

function registerServiceWorker() {
  const base = document.querySelector('base')?.getAttribute('href') ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const swPath = `${normalizedBase}sw.js`;
  navigator.serviceWorker.register(swPath).catch((error) => {
    console.error('Service worker registration failed', error);
  });
}

bootstrapApplication(AppComponent).catch((err) => console.error(err));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker();
  });
}
