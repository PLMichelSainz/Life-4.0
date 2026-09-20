import { useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import OvertimeCalculator from './modules/Overtime/OvertimeCalculator'
import PayrollCalendar from './modules/Payroll/PayrollCalendar'
import TransportExpenses from './modules/Transport/TransportExpenses'
import Wishlist from './modules/Wishlist/Wishlist'
import Debts from './modules/Debts/Debts'

export default function App() {
  const [moduleId, setModuleId] = useState('overtime')
  const [menuOpen, setMenuOpen] = useState(false)

  const seleccionar = (id) => {
    setModuleId(id)
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <Sidebar active={moduleId} onSelect={seleccionar} open={menuOpen} />
      <div className={`sidebar-backdrop${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} />
      <div className="main-col">
        <TopBar moduleId={moduleId} onMenuToggle={() => setMenuOpen((o) => !o)} />
        <main className="content">
          {moduleId === 'overtime' && <OvertimeCalculator />}
          {moduleId === 'payroll' && <PayrollCalendar />}
          {moduleId === 'transport' && <TransportExpenses />}
          {moduleId === 'wishlist' && <Wishlist />}
          {moduleId === 'debts' && <Debts />}
        </main>
        <p className="footer-note">Datos guardados localmente en este dispositivo (localStorage).</p>
      </div>
    </div>
  )
}
