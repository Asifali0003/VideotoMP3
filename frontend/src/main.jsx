import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ConvertProvider } from './features/download/convert.context.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
      <ConvertProvider>
      <App />
    </ConvertProvider>
  </StrictMode>,
)
