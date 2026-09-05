import { useAuth } from '../context/AuthContext'

const MODULOS = [
  { id: 'overtime', num: 'A', label: 'Horas extra' },
  { id: 'payroll', num: 'B', label: 'Catorcenas' },
  { id: 'transport', num: 'C', label: 'Transporte' },
  { id: 'wishlist', num: 'D', label: 'Lista de deseos' },
  { id: 'debts', num: 'E', label: 'Deudas' },
  { id: 'salaries', num: 'F', label: 'Salarios' },
]

export default function Sidebar({ active, onSelect, open }) {
  const { user, signOut } = useAuth()
  return (
    <nav className={`sidebar${open ? ' open' : ''}`}>
      <div className="brand">
        <img src="/icon.png" alt="" className="brand-mark" />
        Catorcena
      </div>
      {MODULOS.map((m) => (
        <button
          key={m.id}
          className={`nav-item${active === m.id ? ' active' : ''}`}
          onClick={() => onSelect(m.id)}
        >
          <span className="num">{m.num}</span>
          {m.label}
        </button>
      ))}
      {user && (
        <div style={{ marginTop: 'auto', paddingTop: 14 }}>
          <div className="card-sub" style={{ padding: '0 14px', wordBreak: 'break-all' }}>{user.email}</div>
          <button className="btn" style={{ margin: '8px 14px', width: 'calc(100% - 28px)' }} onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  )
}
