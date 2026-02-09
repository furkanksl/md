import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Force dark mode for now to match the desktop app's "Zen Dark" vibe as the default for the landing page
document.documentElement.classList.add('dark');

// Inject Umami Analytics only in production
if (import.meta.env.PROD) {
  const script = document.createElement('script');
  script.defer = true;
  script.src = "https://umami.zely.ai/script.js";
  script.setAttribute("data-website-id", "3a92c167-e6e7-44f6-95e6-8b1f3cc2c7dd");
  document.head.appendChild(script);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
