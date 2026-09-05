function Base({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

export const ICONS = {
  overtime: () => (
    <Base>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </Base>
  ),
  payroll: () => (
    <Base>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Base>
  ),
  transport: () => (
    <Base>
      <rect x="3.5" y="5" width="17" height="12" rx="2.5" />
      <path d="M3.5 12h17M7 17v2M17 17v2" />
      <circle cx="7.5" cy="14.3" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="14.3" r="0.6" fill="currentColor" stroke="none" />
    </Base>
  ),
  wishlist: () => (
    <Base>
      <path d="M12 20s-7-4.35-9.5-8.5C1 8.2 2.8 5 6 5c1.9 0 3.4 1 4.5 2.5C11.6 6 13.1 5 15 5c3.2 0 5 3.2 3.5 6.5C19 15.65 12 20 12 20z" />
    </Base>
  ),
  debts: () => (
    <Base>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <circle cx="7" cy="14" r="1" fill="currentColor" stroke="none" />
    </Base>
  ),
  salaries: () => (
    <Base>
      <path d="M12 3v18" />
      <path d="M16.5 7.5c0-1.7-2-3-4.5-3S7.5 5.8 7.5 7.5c0 3 9 2 9 5.5 0 1.7-2 3-4.5 3s-4.5-1.3-4.5-3" />
    </Base>
  ),
  budget: () => (
    <Base>
      <path d="M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1H5" />
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M16 14.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z" fill="currentColor" stroke="none" />
    </Base>
  ),
}
