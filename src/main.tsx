
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SubAccountProvider } from './contexts/SubAccountContext'

// Create root with proper React imports
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SubAccountProvider>
      <App />
    </SubAccountProvider>
  </React.StrictMode>
);
