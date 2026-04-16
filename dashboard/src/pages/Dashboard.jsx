import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getStats, getAnalytics, fmtUptime } from '../lib/api.js'
import { useWebSocket } from '../hooks/useWebSocket.js'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
const CHART_TOOLTIP = {
  contentStyle: {
    background: '#0d1420',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    color: '#f1f5f9',
    fontSize: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  itemStyle:    { color: '#e2e8f0' },
  labelStyle:   { color: '#94a3b8', marginBottom: 4 },
  wrapperStyle: { outline: 'none' },
  cursor:       { fill: 'rgba(255,255,255,0.04)' },
}

function StatCard({ icon, value, label, accent }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <div className="stat-body">
        <strong style={accent ? { color: accent } : {}}>{value ?? '—'}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats,     setStats]     = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const wsStatus = useWebSocket()

  useEffect(() => {
    Promise.all([getStats(), getAnalytics()])
      .then(([s, a]) => { setStats(s); setAnalytics(a) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><span className="spinner" /></div>

  const typeData = analytics ? [
    { name: 'Text',    value: analytics.typeBreakdown.text },
    { name: 'Image',   value: analytics.typeBreakdown.image },
    { name: 'Video',   value: analytics.typeBreakdown.video },
    { name: 'Sticker', value: analytics.typeBreakdown.sticker },
    { name: 'PDF',     value: analytics.typeBreakdown.pdf },
  ].filter(d => d.value > 0) : []

  const connected = wsStatus === 'connected'

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="sub">Overview of your bot's activity and health.</p>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', color: connected ? 'var(--success)' : 'var(--text-muted)' }}>
          <span className={`conn-dot ${connected ? 'on' : ''}`} />
          {connected ? 'Bot Online' : wsStatus === 'connecting' ? 'Connecting…' : 'Bot Offline'}
        </span>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="👥" value={stats?.groupCount}               label="Total Groups" />
        <StatCard icon="✅" value={analytics?.activeGroups}         label="Active Groups"  accent="var(--success)" />
        <StatCard icon="👤" value={stats?.memberCount}              label="Total Members" />
        <StatCard icon="🚫" value={analytics?.blockedMembers}       label="Blocked Members" accent="var(--danger)" />
        <StatCard icon="💬" value={analytics?.totalMessages?.toLocaleString()} label="Total Messages" />
        <StatCard icon="⏱"  value={stats ? fmtUptime(stats.uptime) : null}    label="Uptime" />
      </div>

      {/* Charts row */}
      <div className="charts-row">
        {/* Top groups */}
        <div className="chart-card">
          <p className="chart-title">Top Groups by Messages</p>
          {analytics?.topGroups?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.topGroups.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fill: '#4b5d72', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...CHART_TOOLTIP} formatter={v => [v.toLocaleString(), 'Messages']} />
                <Bar dataKey="messages" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="empty-state">No group data yet.</p>}
        </div>

        {/* Message type donut */}
        <div className="chart-card">
          <p className="chart-title">Message Type Breakdown</p>
          {typeData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip {...CHART_TOOLTIP} formatter={v => [v.toLocaleString(), 'Messages']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="empty-state">No message data yet.</p>}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {[
          { to: '/commands',  icon: '⚙️', label: 'Manage Commands',  sub: `${(stats?.disabledGlobally || []).length} disabled` },
          { to: '/groups',    icon: '👥', label: 'Manage Groups',    sub: `${analytics?.activeGroups ?? '—'} active` },
          { to: '/members',   icon: '👤', label: 'View Members',     sub: `${analytics?.blockedMembers ?? '—'} blocked` },
          { to: '/broadcast', icon: '📢', label: 'Broadcast Message', sub: 'Send to all groups' },
        ].map(({ to, icon, label, sub }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer', gap: 12 }}>
              <span className="stat-icon">{icon}</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
