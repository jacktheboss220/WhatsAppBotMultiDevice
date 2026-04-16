import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth, useToast } from '../App.jsx'
import { getStats, logout, fmtUptime } from '../lib/api.js'
import { useWebSocket } from '../hooks/useWebSocket.js'

const NAV = [
  { to: '/',          icon: '⬡',  label: 'Dashboard',  end: true },
  { to: '/commands',  icon: '⚙️', label: 'Commands' },
  { to: '/groups',    icon: '👥', label: 'Groups' },
  { to: '/members',   icon: '👤', label: 'Members' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/broadcast', icon: '📢', label: 'Broadcast' },
  { to: '/health',    icon: '💚', label: 'Bot Health' },
]

export default function Layout({ children }) {
  const { setAuth } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const wsStatus = useWebSocket()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
    const t = setInterval(() => getStats().then(setStats).catch(() => {}), 30_000)
    return () => clearInterval(t)
  }, [])

  async function handleLogout() {
    try {
      await logout()
      setAuth(false)
      navigate('/login')
    } catch {
      toast('Logout failed', false)
    }
  }

  const connected = wsStatus === 'connected'

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/eva.jpg" alt="Eva" className="brand-img" />
          <div className="brand-text">
            <h1>Eva Bot</h1>
            <p>{stats?.botNumber || 'Loading…'}</p>
          </div>
        </div>

        <nav className="nav">
          {NAV.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="stat-mini">
            <span>Status</span>
            <strong>
              <span className={`conn-dot ${connected ? 'on' : ''}`} />
              {connected ? 'Online' : wsStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </strong>
          </div>
          <div className="stat-mini"><span>Groups</span><strong>{stats?.groupCount ?? '—'}</strong></div>
          <div className="stat-mini"><span>Members</span><strong>{stats?.memberCount ?? '—'}</strong></div>
          <div className="stat-mini"><span>Uptime</span><strong>{stats ? fmtUptime(stats.uptime) : '—'}</strong></div>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  )
}
