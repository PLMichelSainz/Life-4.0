import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppDataProvider } from './context/AppDataContext.jsx'
import AuthGate from './components/AuthGate.jsx'
import { ConfirmProvider } from './components/ConfirmDialog.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <ConfirmProvider>
        <AuthProvider>
          <AuthGate>
            <AppDataProvider>
              <App />
            </AppDataProvider>
          </AuthGate>
        </AuthProvider>
        </ConfirmProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>
)
