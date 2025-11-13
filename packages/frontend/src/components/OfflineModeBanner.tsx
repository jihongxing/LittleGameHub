import React, { useEffect, useState } from 'react'
import { Alert } from 'antd'

const OfflineModeBanner: React.FC = () => {
  const [online, setOnline] = useState<boolean>(navigator.onLine)
  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])
  if (online) return null
  return <Alert banner type="warning" message="当前处于离线模式，一些功能不可用" />
}

export default OfflineModeBanner

