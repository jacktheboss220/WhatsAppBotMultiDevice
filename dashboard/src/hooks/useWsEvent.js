import { useEffect } from 'react'
import { addWsListener, removeWsListener } from './wsClient.js'

export function useWsEvent(type, handler) {
  useEffect(() => {
    addWsListener(type, handler)
    return () => removeWsListener(type, handler)
  }, [type, handler])
}
