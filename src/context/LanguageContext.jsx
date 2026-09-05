import { createContext, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { translations } from '../i18n/translations'

const LanguageContext = createContext(null)

function resolve(dict, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), dict)
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useLocalStorage('lang', 'es')

  const value = useMemo(() => {
    const dict = translations[lang] || translations.es
    function t(path) {
      const val = resolve(dict, path)
      return val !== undefined ? val : path
    }
    function toggleLang() {
      setLang((l) => (l === 'es' ? 'en' : 'es'))
    }
    return { lang, setLang, toggleLang, t }
  }, [lang, setLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
