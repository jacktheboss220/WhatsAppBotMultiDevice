const call = async (method, path, body) => {
  const r = await fetch(path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) {
    const e = await r.json().catch(() => ({}))
    throw new Error(e.error || r.statusText)
  }
  return r.json()
}

export const api = {
  get:   (path)        => call('GET',   path),
  post:  (path, body)  => call('POST',  path, body),
  patch: (path, body)  => call('PATCH', path, body),
}

// Auth
export const getMe    = ()         => api.get('/api/admin/me')
export const login    = (password) => api.post('/api/admin/login', { password })
export const logout   = ()         => api.post('/api/admin/logout')

// Stats
export const getStats = () => api.get('/api/admin/stats')

// Commands
export const getCommands   = ()                           => api.get('/api/admin/commands')
export const toggleCommand = (cmd, disabled, aliases)     =>
  api.patch(`/api/admin/commands/${encodeURIComponent(cmd)}`, { disabled, aliases })

// Groups
export const getGroups     = ()            => api.get('/api/admin/groups')
export const updateGroup   = (jid, update) =>
  api.patch(`/api/admin/groups/${encodeURIComponent(jid)}`, update)

// Members
export const getMembers  = (params) =>
  api.get(`/api/admin/members?${new URLSearchParams(params)}`)
export const memberAction = (jid, action) =>
  api.patch(`/api/admin/members/${encodeURIComponent(jid)}`, { action })

// Analytics
export const getAnalytics = () => api.get('/api/admin/analytics')

// Health
export const getHealth = () => api.get('/api/admin/bot/health')

// Broadcast
export const broadcast = (message, targetJids) =>
  api.post('/api/admin/broadcast', { message, targetJids })

// Pairing code login
export const requestPair = (phoneNumber) =>
  api.post('/api/admin/request-pair', { phoneNumber })

// Clear WhatsApp auth (forces re-login)
export const clearAuth = () =>
  api.post('/api/admin/clear-auth')

// Logout bot from WhatsApp (sends proper logout signal)
export const logoutBot = () =>
  api.post('/api/admin/logout-bot')

// Reconnect — spins up a fresh socket (use after logout or clear-auth)
export const reconnectBot = () =>
  api.post('/api/admin/reconnect')

// Full process restart (last resort — use when reconnect alone isn't enough)
export const restartBot = () =>
  api.post('/api/admin/restart')

// Helpers
export function fmtUptime(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function fmtBytes(bytes) {
  if (bytes < 1024)        return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}
