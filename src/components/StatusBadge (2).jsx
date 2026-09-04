import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function StatusBadge() {
  const online = useOnlineStatus()
  return (
    <span className={`status-badge ${online ? 'online' : 'offline'}`}>
      <span className="dot" />
      {online ? 'Sync' : 'Offline'}
    </span>
  )
}
