import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

const PRELOAD_RELOAD_KEY = 'vite-preload-reload-at'
const PRELOAD_RELOAD_WINDOW_MS = 60_000

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()

  const now = Date.now()
  const previousAttempt = Number(window.sessionStorage.getItem(PRELOAD_RELOAD_KEY) ?? 0)
  if (Number.isFinite(previousAttempt) && now - previousAttempt < PRELOAD_RELOAD_WINDOW_MS) return

  window.sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(now))
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
