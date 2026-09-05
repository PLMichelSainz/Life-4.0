import StatusBadge from './StatusBadge'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function TopBar({ moduleId }) {
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const { t, lang, toggleLang } = useLanguage()

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{t(`topbar.titles.${moduleId}`)}</h1>
      </div>
      <div className="topbar-left">
        <StatusBadge />
        <button className="theme-toggle" onClick={toggleLang} title="ES / EN">
          {lang === 'es' ? '🇲🇽 ES' : '🇬🇧 EN'}
        </button>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? t('topbar.dark') : t('topbar.light')}
        </button>
        <button className="theme-toggle sign-out-desktop" onClick={signOut} title={user?.email || ''}>
          {t('sidebar.signOut')}
        </button>
      </div>
    </header>
  )
}
