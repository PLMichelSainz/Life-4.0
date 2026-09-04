const MODULOS = [
  { id: 'overtime', num: 'A', label: 'Horas extra' },
  { id: 'payroll', num: 'B', label: 'Catorcenas' },
  { id: 'transport', num: 'C', label: 'Transporte' },
  { id: 'wishlist', num: 'D', label: 'Lista de deseos' },
  { id: 'debts', num: 'E', label: 'Deudas' },
  { id: 'salaries', num: 'F', label: 'Salarios' },
]

export default function Sidebar({ active, onSelect, open }) {
  return (
    <nav className={`sidebar${open ? ' open' : ''}`}>
      <div className="brand">
        <span className="brand-mark" />
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
    </nav>
  )
}
