// Banderas en SVG (los emojis de banderas no se dibujan en Windows: salen como letras).
export const IDIOMAS = {
  es: { code: 'ES', nombre: 'Español (México)' },
  en: { code: 'EN', nombre: 'English (Canada)' },
  fr: { code: 'FR', nombre: 'Français (Québec)' },
}

const HOJA = 'M14 2.6l1.3 2.6 1.1-.6-.5 3.3 2-1.4.6 1.3 2.3-.5-.9 2.5 1 .9-3.9 3 .3 1.2-3.5-.6.1 3.2h-.9l.1-3.2-3.5.6.3-1.2-3.9-3 1-.9-.9-2.5 2.3.5.6-1.3 2 1.4-.5-3.3 1.1.6z'

// flor de lis simplificada, centrada en (0,0), ~4.4 de alto
const FLOR = 'M0-2.3C.9-1.3.9-.2 0 .6-.9-.2-.9-1.3 0-2.3zM-.4.5C-1.2-.4-2.4-.3-2.4.6c0 .6.5.9 1.1.8-.2-.4.1-.8.9-.7zM.4.5C1.2-.4 2.4-.3 2.4.6c0 .6-.5.9-1.1.8.2-.4-.1-.8-.9-.7zM-1.2 1.3h2.4v.6h-2.4zM-.3 1.9h.6l.5 1.4h-1.6z'

function Mexico() {
  return (
    <>
      <rect width="9.4" height="20" fill="#006847" />
      <rect x="9.3" width="9.4" height="20" fill="#f4f4f4" />
      <rect x="18.6" width="9.4" height="20" fill="#ce1126" />
      <circle cx="14" cy="10" r="2.7" fill="#9c6b30" />
      <path d="M11.6 11.6c1.6 1.6 3.2 1.6 4.8 0" stroke="#006847" strokeWidth=".9" fill="none" strokeLinecap="round" />
    </>
  )
}
function Canada() {
  return (
    <>
      <rect width="28" height="20" fill="#f4f4f4" />
      <rect width="7" height="20" fill="#d52b1e" />
      <rect x="21" width="7" height="20" fill="#d52b1e" />
      <path d={HOJA} fill="#d52b1e" transform="translate(0 1.4)" />
    </>
  )
}
function Quebec() {
  return (
    <>
      <rect width="28" height="20" fill="#0a3d91" />
      <rect x="12.2" width="3.6" height="20" fill="#f4f4f4" />
      <rect y="8.2" width="28" height="3.6" fill="#f4f4f4" />
      {[[6.1, 4.1], [21.9, 4.1], [6.1, 15.9], [21.9, 15.9]].map(([x, y]) => (
        <path key={`${x}-${y}`} d={FLOR} fill="#f4f4f4" transform={`translate(${x} ${y}) scale(.95)`} />
      ))}
    </>
  )
}

export function FlagIcon({ lang, width = 21 }) {
  const Bandera = { es: Mexico, en: Canada, fr: Quebec }[lang] || Mexico
  return (
    <svg
      viewBox="0 0 28 20"
      width={width}
      height={(width * 20) / 28}
      role="img"
      aria-label={IDIOMAS[lang]?.nombre}
      style={{ borderRadius: 2, boxShadow: '0 0 0 1px rgba(128,128,128,.45)', flexShrink: 0 }}
    >
      <Bandera />
    </svg>
  )
}
