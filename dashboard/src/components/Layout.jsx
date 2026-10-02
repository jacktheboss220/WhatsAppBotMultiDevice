import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth, useToast } from '../App.jsx'
import { getStats, logout, fmtUptime } from '../lib/api.js'
import { reconnectWs } from '../hooks/wsClient.js'
import { useWebSocket } from '../hooks/useWebSocket.js'
import { cx } from './ui.jsx'

const NAV = [
  { to: '/',          icon: '⬡',  label: 'Dashboard',  end: true },
  { to: '/commands',  icon: '⚙️', label: 'Commands' },
  { to: '/groups',    icon: '👥', label: 'Groups' },
  { to: '/members',   icon: '👤', label: 'Members' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/dm',        icon: '✉️', label: 'Direct Message' },
  { to: '/broadcast', icon: '📢', label: 'Broadcast' },
  { to: '/logs',      icon: '📋', label: 'Logs' },
  { to: '/health',    icon: '💚', label: 'Bot Health' },
  { to: '/settings',  icon: '⚙',  label: 'Settings' },
]

function MiniStat({ label, children }) {
  return (
    <div className="flex justify-between px-1 py-[3px] text-[0.74rem] text-muted">
      <span>{label}</span>
      <strong className="font-semibold text-soft">{children}</strong>
    </div>
  )
}

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
      reconnectWs()
      navigate('/login')
    } catch {
      toast('Logout failed', false)
    }
  }

  const connected = wsStatus === 'connected'

  return (
    <div className="flex flex-col md:flex-row md:h-screen md:overflow-hidden min-h-screen">
      <aside className="flex flex-row md:flex-col flex-wrap md:flex-nowrap items-center md:items-stretch justify-between md:justify-start gap-0.5 shrink-0 w-full md:w-[234px] min-[1920px]:w-[260px] min-[2560px]:w-[300px] bg-s1 border-b md:border-b-0 md:border-r border-line px-3.5 py-2.5 md:py-[18px] md:overflow-y-auto">
        <div className="flex items-center gap-2.5 px-1 py-0.5 md:mb-5">
          <img src="/eva.jpg" alt="Eva" className="size-9 rounded-[10px] object-cover border border-line shrink-0" />
          <div>
            <h1 className="text-[0.95rem] font-bold leading-tight">Eva Bot</h1>
            <p className="text-[0.7rem] text-muted mt-0.5">{stats?.botNumber || 'Loading…'}</p>
          </div>
        </div>

        <nav className="flex flex-row md:flex-col gap-1 md:gap-0.5 md:flex-1 overflow-x-auto md:overflow-visible">
          {NAV.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cx(
                'flex items-center gap-2 md:gap-[9px] px-3 py-2 rounded-md text-[0.84rem] font-medium whitespace-nowrap transition-colors',
                isActive ? 'bg-accent/10 text-accent' : 'text-soft hover:bg-s2 hover:text-ink'
              )}
            >
              <span className="hidden md:inline-block w-[18px] text-center text-base shrink-0">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex flex-col gap-[5px] border-t border-line pt-3.5 mt-3.5">
          <MiniStat label="Status">
            <span className={cx('inline-block size-1.5 rounded-full mr-1.5 align-middle', connected ? 'bg-success animate-glow' : 'bg-danger')} />
            {connected ? 'Online' : wsStatus === 'connecting' ? 'Connecting' : 'Offline'}
          </MiniStat>
          <MiniStat label="Groups">{stats?.groupCount ?? '—'}</MiniStat>
          <MiniStat label="Members">{stats?.memberCount ?? '—'}</MiniStat>
          <MiniStat label="Uptime">{stats ? fmtUptime(stats.uptime) : '—'}</MiniStat>
          <button
            className="w-full mt-1.5 py-2 rounded-md border border-danger/30 text-danger text-[0.8rem] font-semibold hover:bg-danger/10 hover:border-danger transition"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 md:overflow-y-auto bg-bg p-3.5 md:px-8 md:py-7 min-[1440px]:px-[52px] min-[1920px]:px-[68px] min-[2560px]:px-24">{children}</main>
    </div>
  )
}
