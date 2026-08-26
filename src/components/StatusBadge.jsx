import { useAppData } from '../context/AppDataContext'

export default function StatusBadge() {
  const { cloudOnline } = useAppData()

  return (
    <span className={`status-badge ${cloudOnline ? 'online' : 'offline'}`}>
      <span className="dot" />
      {cloudOnline ? 'ONLINE' : 'OFFLINE'}
    </span>
  )
}
