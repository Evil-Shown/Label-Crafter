import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { useLabelStore } from './store/labelStore'

const savedTheme = localStorage.getItem('lc-theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

// Dev-only handle so the store can be inspected from the console. Stripped
// from production builds by the `import.meta.env.DEV` guard.
if (import.meta.env.DEV) {
  window.__labelStore = useLabelStore
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
