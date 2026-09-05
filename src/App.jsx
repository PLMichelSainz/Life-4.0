import { useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { useLanguage } from './context/LanguageContext'
import OvertimeCalculator from './modules/Overtime/OvertimeCalculator'
import PayrollCalendar from './modules/Payroll/PayrollCalendar'
import TransportExpenses from './modules/Transport/TransportExpenses'
import Wishlist from './modules/Wishlist/Wishlist'
import Debts from './modules/Debts/Debts'
import SalaryRates from './modules/Salaries/SalaryRates'
import Budget from './modules/Budget/Budget'

export default function App() {
  const [moduleId, setModuleId] = useState('overtime')
  const { t } = useLanguage()

  return (
    <div className="app-shell">
      <Sidebar active={moduleId} onSelect={setModuleId} />
      <div className="main-col">
        <TopBar moduleId={moduleId} />
        <main className="content">
          {moduleId === 'overtime' && <OvertimeCalculator />}
          {moduleId === 'payroll' && <PayrollCalendar />}
          {moduleId === 'transport' && <TransportExpenses />}
          {moduleId === 'wishlist' && <Wishlist />}
          {moduleId === 'debts' && <Debts />}
          {moduleId === 'salaries' && <SalaryRates />}
          {moduleId === 'budget' && <Budget />}
        </main>
        <p className="footer-note">{t('footer')}</p>
      </div>
    </div>
  )
}
