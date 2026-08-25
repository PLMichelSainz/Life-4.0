import StatusBadge from './StatusBadge'
import { useTheme } from '../context/ThemeContext'

const TITULOS = {
  overtime: 'Calculadora de horas extra',
  payroll: 'Calendario de catorcenas',
  transport: 'Gastos de transporte',
  wishlist: 'Lista de deseos',
  debts: 'Deudas',
}

export default function TopBar({ moduleId, onMenuToggle }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-btn" onClick={onMenuToggle} aria-label="Abrir menú">☰</button>
        <h1 style={{ fontSize: '1rem', margin: 0 }}>{TITULOS[moduleId]}</h1>
      </div>
      <div className="topbar-left">
        <StatusBadge />
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☾ Oscuro' : '☀ Claro'}
        </button>
      </div>
    </header>
  )
}
