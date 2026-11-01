import React from 'react'
import ReactDOM from 'react-dom/client'
// Color customization is paused for the new Figma theme.
// import { applyAccentColor, loadAccent } from './accentTheme'
import App from './App'
import './index.css'

// applyAccentColor(loadAccent())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
