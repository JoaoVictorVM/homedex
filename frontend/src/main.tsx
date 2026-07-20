import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/press-start-2p'
import './styles/tokens.css'
import './styles/global.css'
import { App } from './App.tsx'

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('elemento #root não encontrado no index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
