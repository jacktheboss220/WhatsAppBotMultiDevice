// Global singleton WebSocket manager.
// Single connection, distributes typed events to registered listeners.
// Re-exports nothing React-specific — plain JS module.

const listeners = new Map()

function emit(type, data) {
  listeners.get(type)?.forEach(fn => fn(data))
}

export function addWsListener(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set())
  listeners.get(type).add(fn)
}

export function removeWsListener(type, fn) {
  listeners.get(type)?.delete(fn)
}

let reconnectTimer = null

function connect() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws    = new WebSocket(`${proto}//${location.host}`)

  ws.onopen  = () => emit('_status', { status: 'connecting' })
  ws.onclose = () => {
    emit('_status', { status: 'disconnected' })
    clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(connect, 5000)
  }
  ws.onerror = () => emit('_status', { status: 'disconnected' })

  ws.onmessage = evt => {
    try {
      const data = JSON.parse(evt.data)
      if (data.type === 'status' && data.status === 'connected') {
        emit('_status', { status: 'connected' })
      }
      emit(data.type, data)
    } catch (_) {}
  }
}

connect()
