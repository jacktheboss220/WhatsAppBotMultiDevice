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
import { useToast } from '../App.jsx'
import { Card, ChartTitle, Code, Empty, Loading, PageHeader, StatCard, StatGrid, cx } from '../components/ui.jsx'

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

const ACTIVITY_META = {
  command_used:      { icon: '⚙️', label: 'Command',   cls: 'text-accent bg-accent/10' },
  member_blocked:    { icon: '🚫', label: 'Blocked',   cls: 'text-danger bg-danger/10' },
  member_unblocked:  { icon: '✅', label: 'Unblocked', cls: 'text-success bg-success/10' },
  broadcast_sent:    { icon: '📢', label: 'Broadcast', cls: 'text-warning bg-warning/10' },
  dm_sent:           { icon: '✉️', label: 'DM Sent',   cls: 'text-purple bg-purple/10' },
}

function fmtAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

function ActivityDetail({ kind, detail }) {
  if (kind === 'command_used') return <span><Code className="text-accent bg-transparent p-0">{detail.cmd}</Code> by {detail.name || detail.from?.split('@')[0]} in {detail.group}</span>
  if (kind === 'member_blocked' || kind === 'member_unblocked') return <Code className="bg-transparent p-0 text-muted">{detail.jid}</Code>
  if (kind === 'broadcast_sent') return <span>{detail.sent}/{detail.total} sent — "{detail.preview}"</span>
  if (kind === 'dm_sent') return <span>to <Code className="bg-transparent p-0">{detail.to}</Code></span>
  return <span>{JSON.stringify(detail)}</span>
}

export default function Dashboard() {
  const toast = useToast()
  const [stats,     setStats]     = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [activity,  setActivity]  = useState([])
  const wsStatus = useWebSocket()

  useEffect(() => {
    Promise.all([getStats(), getAnalytics(), getActivity()])
      .then(([s, a, act]) => { setStats(s); setAnalytics(a); setActivity((act.activity || []).slice().reverse()) })
      .catch(() => toast('Failed to load dashboard data', false))
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

  if (loading) return <Loading />

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

  const shortcuts = [
    { to: '/commands',  icon: '⚙️', label: 'Manage Commands',  sub: `${(stats?.disabledGlobally || []).length} disabled` },
    { to: '/groups',    icon: '👥', label: 'Manage Groups',    sub: `${analytics?.activeGroups ?? '—'} active` },
    { to: '/members',   icon: '👤', label: 'View Members',     sub: `${analytics?.blockedMembers ?? '—'} blocked` },
    { to: '/dm',        icon: '✉️', label: 'Direct Message',   sub: 'Message any user' },
    { to: '/broadcast', icon: '📢', label: 'Broadcast',        sub: 'Send to all groups' },
    { to: '/logs',      icon: '📋', label: 'Logs',             sub: 'Live bot output' },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" sub="Overview of your bot's activity and health.">
        <span className={cx('flex items-center gap-[7px] text-[0.82rem]', connected ? 'text-success' : 'text-muted')}>
          <span className={cx('size-1.5 rounded-full', connected ? 'bg-success animate-glow' : 'bg-danger')} />
          {connected ? 'Bot Online' : wsStatus === 'connecting' ? 'Connecting…' : 'Bot Offline'}
        </span>
      </PageHeader>

      <StatGrid>
        <StatCard icon="👥" value={stats?.groupCount}               label="Total Groups" />
        <StatCard icon="✅" value={analytics?.activeGroups}         label="Active Groups"    color="text-success" />
        <StatCard icon="👤" value={stats?.memberCount}              label="Total Members" />
        <StatCard icon="🚫" value={analytics?.blockedMembers}       label="Blocked Members"  color="text-danger" />
        <StatCard icon="💬" value={analytics?.totalMessages?.toLocaleString()} label="Total Messages" />
        <StatCard icon="⏱"  value={stats ? fmtUptime(stats.uptime) : null}     label="Uptime" />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        <Card>
          <ChartTitle>Top Groups by Messages</ChartTitle>
          {topGroups.length ? (
            <div className="h-[clamp(220px,28vh,480px)]">
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
          ) : <Empty>No group data yet.</Empty>}
        </Card>

        <Card>
          <ChartTitle>Message Type Breakdown</ChartTitle>
          {typeData.length ? (
            <div className="h-[clamp(220px,28vh,480px)]">
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
          ) : <Empty>No message data yet.</Empty>}
        </Card>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5 mb-[18px]">
        {shortcuts.map(({ to, icon, label, sub }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 bg-s1 border border-line hover:border-line-hi rounded-[14px] px-[18px] py-4 transition-colors"
          >
            <span className="text-2xl shrink-0">{icon}</span>
            <div>
              <div className="text-[0.85rem] font-semibold">{label}</div>
              <div className="text-[0.72rem] text-muted mt-0.5">{sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <Card>
        <ChartTitle>Recent Activity</ChartTitle>
        {activity.length === 0 ? (
          <Empty>No activity yet. Use the bot to see live events here.</Empty>
        ) : (
          <div className="flex flex-col">
            {activity.map(ev => {
              const m = ACTIVITY_META[ev.kind] || { icon: '•', label: ev.kind, cls: 'text-soft bg-s2' }
              return (
                <div key={ev.id} className="flex items-center gap-2.5 py-[9px] border-b border-line last:border-b-0 text-[0.82rem]">
                  <span className="w-5 shrink-0 text-center text-base">{m.icon}</span>
                  <span className={cx('shrink-0 px-2 py-0.5 rounded-full text-[0.66rem] font-bold uppercase tracking-wide', m.cls)}>{m.label}</span>
                  <span className="flex-1 min-w-0 text-soft break-words"><ActivityDetail kind={ev.kind} detail={ev.detail || {}} /></span>
                  <span className="shrink-0 whitespace-nowrap text-[0.72rem] text-muted">{fmtAgo(ev.ts)}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
