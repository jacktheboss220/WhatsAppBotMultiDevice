import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  ArcElement,
  RadialLinearScale,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { PolarArea, Bar } from 'react-chartjs-2'
import { getStats, getAnalytics, getActivity, fmtUptime } from '../lib/api.js'
import { useWebSocket } from '../hooks/useWebSocket.js'
import { useWsEvent } from '../hooks/useWsEvent.js'

ChartJS.register(ArcElement, RadialLinearScale, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const PIE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

const TOOLTIP = {
  backgroundColor: '#0d1420',
  borderColor: 'rgba(255,255,255,0.12)',
  borderWidth: 1,
  titleColor: '#94a3b8',
  bodyColor: '#e2e8f0',
  padding: 10,
  cornerRadius: 8,
  boxWidth: 8,
  boxHeight: 8,
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

const ACTIVITY_META = {
  command_used:      { icon: '⚙️', label: 'Command',   color: '#0ea5e9' },
  member_blocked:    { icon: '🚫', label: 'Blocked',   color: '#ef4444' },
  member_unblocked:  { icon: '✅', label: 'Unblocked', color: '#10b981' },
  broadcast_sent:    { icon: '📢', label: 'Broadcast', color: '#f59e0b' },
  dm_sent:           { icon: '✉️', label: 'DM Sent',   color: '#8b5cf6' },
}

function fmtAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

function ActivityDetail({ kind, detail }) {
  if (kind === 'command_used') return <span><code style={{ fontFamily: 'monospace', color: '#0ea5e9' }}>{detail.cmd}</code> by {detail.name || detail.from?.split('@')[0]} in {detail.group}</span>
  if (kind === 'member_blocked' || kind === 'member_unblocked') return <code style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{detail.jid}</code>
  if (kind === 'broadcast_sent') return <span>{detail.sent}/{detail.total} sent — "{detail.preview}"</span>
  if (kind === 'dm_sent') return <span>to <code style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{detail.to}</code></span>
  return <span>{JSON.stringify(detail)}</span>
}

export default function Dashboard() {
  const [stats,     setStats]     = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [activity,  setActivity]  = useState([])
  const wsStatus = useWebSocket()

  useEffect(() => {
    Promise.all([getStats(), getAnalytics(), getActivity()])
      .then(([s, a, act]) => { setStats(s); setAnalytics(a); setActivity((act.activity || []).slice().reverse()) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleActivity = useCallback(data => {
    const ev = data.event || data
    if (ev?.id) setActivity(prev => [ev, ...prev.slice(0, 19)])
  }, [])

  const handleActivitySnapshot = useCallback(data => {
    if (data.activity?.length) setActivity(data.activity.slice().reverse())
  }, [])

  useWsEvent('activity', handleActivity)
  useWsEvent('activity_snapshot', handleActivitySnapshot)

  if (loading) return <div className="loading-state"><span className="spinner" /></div>

  const typeData = analytics ? [
    { name: 'Text',    value: analytics.typeBreakdown.text },
    { name: 'Image',   value: analytics.typeBreakdown.image },
    { name: 'Video',   value: analytics.typeBreakdown.video },
    { name: 'Sticker', value: analytics.typeBreakdown.sticker },
    { name: 'PDF',     value: analytics.typeBreakdown.pdf },
  ].filter(d => d.value > 0) : []

  const topGroups = analytics?.topGroups?.slice(0, 6) || []

  const polarData = {
    labels: typeData.map(d => d.name),
    datasets: [{
      data: typeData.map(d => d.value),
      backgroundColor: PIE_COLORS.map(c => c + 'bb'),
      borderColor: PIE_COLORS,
      borderWidth: 1.5,
    }],
  }

  const groupBarData = {
    labels: topGroups.map(g => g.name),
    datasets: [{ data: topGroups.map(g => g.messages), backgroundColor: '#0ea5e9', borderRadius: 4, barThickness: 22 }],
  }

  const connected = wsStatus === 'connected'

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="sub">Overview of your bot's activity and health.</p>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', color: connected ? '#10b981' : '#4b5d72' }}>
          <span className={`conn-dot ${connected ? 'on' : ''}`} />
          {connected ? 'Bot Online' : wsStatus === 'connecting' ? 'Connecting…' : 'Bot Offline'}
        </span>
      </div>

      <div className="stats-grid">
        <StatCard icon="👥" value={stats?.groupCount}               label="Total Groups" />
        <StatCard icon="✅" value={analytics?.activeGroups}         label="Active Groups"  accent="#10b981" />
        <StatCard icon="👤" value={stats?.memberCount}              label="Total Members" />
        <StatCard icon="🚫" value={analytics?.blockedMembers}       label="Blocked Members" accent="#ef4444" />
        <StatCard icon="💬" value={analytics?.totalMessages?.toLocaleString()} label="Total Messages" />
        <StatCard icon="⏱"  value={stats ? fmtUptime(stats.uptime) : null}    label="Uptime" />
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <p className="chart-title">Top Groups by Messages</p>
          {topGroups.length ? (
            <div style={{ height: 'clamp(220px, 28vh, 480px)' }}>
              <Bar
                data={groupBarData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { ...TOOLTIP, callbacks: { label: ctx => ` ${ctx.parsed.x.toLocaleString()} msgs` } },
                  },
                  scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#4b5d72', font: { size: 11 } }, border: { display: false } },
                    y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } }, border: { display: false } },
                  },
                }}
              />
            </div>
          ) : <p className="empty-state">No group data yet.</p>}
        </div>

        <div className="chart-card">
          <p className="chart-title">Message Type Breakdown</p>
          {typeData.length ? (
            <div style={{ height: 'clamp(220px, 28vh, 480px)' }}>
              <PolarArea
                data={polarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 10, padding: 12 } },
                    tooltip: { ...TOOLTIP, callbacks: { label: ctx => ` ${ctx.parsed.r.toLocaleString()} Messages` } },
                  },
                  scales: {
                    r: {
                      grid: { color: 'rgba(255,255,255,0.07)' },
                      ticks: { color: '#4b5d72', font: { size: 9 }, backdropColor: 'transparent', maxTicksLimit: 4 },
                      angleLines: { color: 'rgba(255,255,255,0.07)' },
                    },
                  },
                }}
              />
            </div>
          ) : <p className="empty-state">No message data yet.</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 18 }}>
        {[
          { to: '/commands',  icon: '⚙️', label: 'Manage Commands',  sub: `${(stats?.disabledGlobally || []).length} disabled` },
          { to: '/groups',    icon: '👥', label: 'Manage Groups',    sub: `${analytics?.activeGroups ?? '—'} active` },
          { to: '/members',   icon: '👤', label: 'View Members',     sub: `${analytics?.blockedMembers ?? '—'} blocked` },
          { to: '/dm',        icon: '✉️', label: 'Direct Message',   sub: 'Message any user' },
          { to: '/broadcast', icon: '📢', label: 'Broadcast',        sub: 'Send to all groups' },
          { to: '/logs',      icon: '📋', label: 'Logs',             sub: 'Live bot output' },
        ].map(({ to, icon, label, sub }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer', gap: 12 }}>
              <span className="stat-icon">{icon}</span>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: '0.72rem', color: '#4b5d72', marginTop: 2 }}>{sub}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="chart-card">
        <p className="chart-title">Recent Activity</p>
        {activity.length === 0 ? (
          <p className="empty-state" style={{ padding: '24px' }}>No activity yet. Use the bot to see live events here.</p>
        ) : (
          <div className="activity-list">
            {activity.map(ev => {
              const m = ACTIVITY_META[ev.kind] || { icon: '•', label: ev.kind, color: 'var(--text-soft)' }
              return (
                <div key={ev.id} className="activity-row">
                  <span className="activity-icon">{m.icon}</span>
                  <span className="activity-badge" style={{ color: m.color, background: m.color + '18' }}>{m.label}</span>
                  <span className="activity-detail"><ActivityDetail kind={ev.kind} detail={ev.detail || {}} /></span>
                  <span className="activity-time">{fmtAgo(ev.ts)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
