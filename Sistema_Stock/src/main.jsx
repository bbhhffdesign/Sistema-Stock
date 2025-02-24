import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Background from "./components/Background"
import './index.css'
import App from './App.jsx'
import "tailwindcss";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Background />
   
  </StrictMode>,
)
