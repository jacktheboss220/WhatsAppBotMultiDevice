import { useEffect, useState } from 'react'
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
import { getAnalytics } from '../lib/api.js'

ChartJS.register(ArcElement, RadialLinearScale, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const PIE_COLORS  = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
const BAR_COLORS  = ['#0ea5e9', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff',
                     '#0ea5e9', '#60a5fa', '#93c5fd', '#bfdbfe']

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

const POLAR_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 10, padding: 14 } },
    tooltip: { ...TOOLTIP, callbacks: { label: ctx => ` ${ctx.parsed.r.toLocaleString()} Messages` } },
  },
  scales: {
    r: {
      grid: { color: 'rgba(255,255,255,0.07)' },
      ticks: { color: '#4b5d72', font: { size: 9 }, backdropColor: 'transparent', maxTicksLimit: 4 },
      angleLines: { color: 'rgba(255,255,255,0.07)' },
    },
  },
}

const BAR_OPTS = {
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
}

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
    datasets: [{ data: topGroups.map(g => g.messages), backgroundColor: BAR_COLORS, borderRadius: 4, barThickness: 18 }],
  }

  const memberBarData = {
    labels: topMembers.map(m => m.name),
    datasets: [{ data: topMembers.map(m => m.messages), backgroundColor: '#10b981', borderRadius: 4, barThickness: 18 }],
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Analytics</h2>
          <p className="sub">Message statistics across all groups and members.</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <Stat label="Total Messages"  value={totalMessages} color="#3b82f6" />
        <Stat label="Active Groups"   value={activeGroups}  color="#10b981" />
        <Stat label="Blocked Members" value={blockedMembers} color="#ef4444" />
        <Stat label="Total Groups"    value={totalGroups} />
        <Stat label="Total Members"   value={totalMembers} />
        <Stat label="Avg Msgs/Member" value={totalMembers ? Math.round(totalMessages / totalMembers) : 0} />
      </div>

      <div className="charts-row" style={{ marginBottom: 14 }}>
        <div className="chart-card">
          <p className="chart-title">Message Type Distribution</p>
          {typeData.length ? (
            <div style={{ height: 'clamp(260px, 32vh, 560px)' }}>
              <PolarArea data={polarData} options={POLAR_OPTS} />
            </div>
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
                    <span style={{ color: '#94a3b8' }}>{icon} {label}</span>
                    <span style={{ color: '#4b5d72' }}>{value.toLocaleString()} ({pct}%)</span>
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

      <div className="chart-card" style={{ marginBottom: 14 }}>
        <p className="chart-title">Top 10 Groups by Messages</p>
        {topGroups.length ? (
          <div style={{ height: `clamp(${Math.max(topGroups.length * 38 + 24, 300)}px, 42vh, 700px)` }}>
            <Bar data={groupBarData} options={BAR_OPTS} />
          </div>
        ) : <p className="empty-state">No group data yet.</p>}
      </div>

      <div className="chart-card">
        <p className="chart-title">Top 10 Members by Messages</p>
        {topMembers.length ? (
          <div style={{ height: `clamp(${Math.max(topMembers.length * 38 + 24, 300)}px, 42vh, 700px)` }}>
            <Bar data={memberBarData} options={BAR_OPTS} />
          </div>
        ) : <p className="empty-state">No member data yet.</p>}
      </div>
    </div>
  )
}
