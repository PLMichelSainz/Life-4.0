import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { ICONS } from './NavIcons'

const MODULOS = ['overtime', 'payroll', 'transport', 'wishlist', 'debts', 'salaries', 'budget', 'products', 'tasks']

export default function Sidebar({ active, onSelect }) {
  const { user, signOut } = useAuth()
  const { t } = useLanguage()
  const [collapsed, setCollapsed] = useLocalStorage('sidebar.collapsed', false)

  return (
    <nav className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="brand">
        <img src="/icon.png" alt="" className="brand-mark" />
        <span className="brand-text">{t('sidebar.brand')}</span>
      </div>

      {MODULOS.map((id) => {
        const Icon = ICONS[id]
        return (
          <button
            key={id}
            className={`nav-item${active === id ? ' active' : ''}`}
            onClick={() => onSelect(id)}
            title={collapsed ? t(`sidebar.${id}`) : undefined}
          >
            <span className="nav-icon"><Icon /></span>
            <span className="nav-label">{t(`sidebar.${id}`)}</span>
          </button>
        )
      })}

      <button className="collapse-toggle" onClick={() => setCollapsed((c) => !c)} title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}>
        {collapsed ? '»' : '«'}
      </button>

      {user && (
        <div className="sidebar-account">
          <div className="card-sub sidebar-email">{user.email}</div>
          <button className="btn sidebar-signout" onClick={signOut} title={t('sidebar.signOut')}>
            {collapsed ? '⏻' : t('sidebar.signOut')}
          </button>
        </div>
      )}
    </nav>
  )
}
