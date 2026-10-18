import { createContext, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { translations } from '../i18n/translations'

const LanguageContext = createContext(null)
const ORDEN_IDIOMAS = ['es', 'en', 'fr']

function resolve(dict, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), dict)
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useLocalStorage('lang', 'es')

  const value = useMemo(() => {
    const dict = translations[lang] || translations.es
    function t(path) {
      const val = resolve(dict, path)
      if (val !== undefined) return val
      // Si falta un texto en este idioma, se usa el inglés antes de mostrar la clave.
      const respaldo = lang !== 'en' ? resolve(translations.en, path) : undefined
      return respaldo !== undefined ? respaldo : path
    }
    // Ciclo de idiomas: ES (México) → EN (Canadá) → FR (Quebec)
    function toggleLang() {
      setLang((l) => ORDEN_IDIOMAS[(ORDEN_IDIOMAS.indexOf(l) + 1) % ORDEN_IDIOMAS.length])
    }
    return { lang, setLang, toggleLang, t }
  }, [lang, setLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
