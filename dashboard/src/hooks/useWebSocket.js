import { useEffect, useRef, useState } from 'react'

export function useWebSocket() {
  const [status, setStatus] = useState('connecting') // 'connecting' | 'connected' | 'disconnected'
  const wsRef = useRef(null)

  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${proto}//${location.host}`
    let ws

    function connect() {
      ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen  = () => setStatus('connecting')
      ws.onclose = () => { setStatus('disconnected'); setTimeout(connect, 5000) }
      ws.onerror = () => { setStatus('disconnected') }

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          if (data.type === 'status' && data.status === 'connected') {
            setStatus('connected')
          }
        } catch (_) {}
      }
    }

    connect()
    return () => {
      ws.onclose = null // prevent reconnect on intentional close
      ws.close()
    }
  }, [])

  return status
}
