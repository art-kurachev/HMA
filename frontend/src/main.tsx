import React from 'react'
import ReactDOM from 'react-dom/client'
import { applyAccentColor, loadAccent } from './accentTheme'
import App from './App'
import './index.css'

applyAccentColor(loadAccent())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
