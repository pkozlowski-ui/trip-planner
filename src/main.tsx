import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '@carbon/styles/css/styles.css'
import 'leaflet/dist/leaflet.css'
import './index.css'
import './styles/carbon-overrides.scss'
// Import debug utility (only in development)
if (import.meta.env.DEV) {
  import('./services/firebase/debug-config');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

