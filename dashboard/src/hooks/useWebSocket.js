import { useEffect, useState } from 'react'
import { addWsListener, removeWsListener } from './wsClient.js'

export function useWebSocket() {
  const [status, setStatus] = useState('connecting')

  useEffect(() => {
    function handle({ status }) {
      setStatus(status)
    }
    addWsListener('_status', handle)
    return () => removeWsListener('_status', handle)
  }, [])

  return status
}
