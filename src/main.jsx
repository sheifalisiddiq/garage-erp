import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply persisted theme before first render to avoid flash
const savedTheme = localStorage.getItem('pitstop-theme') || 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)
document.documentElement.setAttribute('data-accent', 'monochrome')
document.documentElement.setAttribute('data-density', 'comfortable')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
