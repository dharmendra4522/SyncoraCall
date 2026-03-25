import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UserProvider } from './context/UserContextApi.jsx';

import { Buffer } from 'buffer';
window.global = window;
window.Buffer = Buffer;

// Start the app
console.log("App Initialization Started");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </StrictMode>
)
