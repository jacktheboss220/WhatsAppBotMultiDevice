import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import { getAnalytics } from '../lib/api.js'

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
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
const BAR_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff']

function Stat({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-body">
        <strong style={{ fontSize: '1.6rem', color: color || 'var(--text)' }}>{(value ?? 0).toLocaleString()}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-state"><span className="spinner" /></div>
  if (error)   return <p className="error-state">{error}</p>
  if (!data)   return null

  const { topGroups, topMembers, typeBreakdown, totalMessages, activeGroups, blockedMembers, totalGroups, totalMembers } = data

  const typeData = [
    { name: 'Text',    value: typeBreakdown.text },
    { name: 'Image',   value: typeBreakdown.image },
    { name: 'Video',   value: typeBreakdown.video },
    { name: 'Sticker', value: typeBreakdown.sticker },
    { name: 'PDF',     value: typeBreakdown.pdf },
  ].filter(d => d.value > 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Analytics</h2>
          <p className="sub">Message statistics across all groups and members.</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <Stat label="Total Messages"  value={totalMessages} color="var(--accent)" />
        <Stat label="Active Groups"   value={activeGroups}  color="var(--success)" />
        <Stat label="Blocked Members" value={blockedMembers} color="var(--danger)" />
        <Stat label="Total Groups"    value={totalGroups} />
        <Stat label="Total Members"   value={totalMembers} />
        <Stat label="Avg Msgs/Member" value={totalMembers ? Math.round(totalMessages / totalMembers) : 0} />
      </div>

      {/* Type breakdown + Top groups */}
      <div className="charts-row" style={{ marginBottom: 14 }}>
        <div className="chart-card">
          <p className="chart-title">Message Type Distribution</p>
          {typeData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="46%" innerRadius={65} outerRadius={100} dataKey="value" paddingAngle={3}>
                  {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip {...CHART_TOOLTIP} formatter={v => [v.toLocaleString(), 'Messages']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="empty-state">No message data yet.</p>}
        </div>

        <div className="chart-card">
          <p className="chart-title">Type Breakdown (count)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {[
              { icon: '💬', label: 'Text',    value: typeBreakdown.text },
              { icon: '🖼️', label: 'Image',   value: typeBreakdown.image },
              { icon: '🎥', label: 'Video',   value: typeBreakdown.video },
              { icon: '🎭', label: 'Sticker', value: typeBreakdown.sticker },
              { icon: '📄', label: 'PDF',     value: typeBreakdown.pdf },
            ].map(({ icon, label, value }, i) => {
              const pct = totalMessages ? Math.round((value / totalMessages) * 100) : 0
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-soft)' }}>{icon} {label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{value.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: PIE_COLORS[i] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Groups */}
      <div className="chart-card" style={{ marginBottom: 14 }}>
        <p className="chart-title">Top 10 Groups by Messages</p>
        {topGroups.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topGroups} layout="vertical" margin={{ left: 0, right: 24 }}>
              <XAxis type="number" tick={{ fill: '#4b5d72', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} formatter={v => [v.toLocaleString(), 'Messages']} />
              <Bar dataKey="messages" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {topGroups.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="empty-state">No group data yet.</p>}
      </div>

      {/* Top Members */}
      <div className="chart-card">
        <p className="chart-title">Top 10 Members by Messages</p>
        {topMembers.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topMembers} layout="vertical" margin={{ left: 0, right: 24 }}>
              <XAxis type="number" tick={{ fill: '#4b5d72', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP} formatter={v => [v.toLocaleString(), 'Messages']} />
              <Bar dataKey="messages" fill="var(--success)" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="empty-state">No member data yet.</p>}
      </div>
    </div>
  )
}
