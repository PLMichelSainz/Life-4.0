import { useState } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useLanguage } from '../context/LanguageContext'
import { useAppData } from '../context/AppDataContext'

export default function StatusBadge() {
  const online = useOnlineStatus()
  const { t } = useLanguage()
  const appData = useAppData()
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  async function handleClick() {
    if (!online || syncing || !appData?.syncAll) return
    setSyncing(true)
    try {
      await appData.syncAll()
      setJustSynced(true)
      setTimeout(() => setJustSynced(false), 1800)
    } finally {
      setSyncing(false)
    }
  }

  let label = online ? t('status.sync') : t('status.offline')
  if (syncing) label = t('status.syncing')
  else if (justSynced) label = t('status.synced')

  return (
    <button
      className={`status-badge ${online ? 'online' : 'offline'}`}
      onClick={handleClick}
      disabled={!online}
      title={online ? t('status.sync') : t('status.offline')}
    >
      <span className="dot" />
      {label}
    </button>
  )
}
