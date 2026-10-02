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
import { getAnalytics, getCommandStats, getCommands } from '../lib/api.js'
import { Card, ChartTitle, Empty, ErrorState, Loading, PageHeader, ProgressBar, StatCard, StatGrid } from '../components/ui.jsx'

ChartJS.register(ArcElement, RadialLinearScale, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const PIE_COLORS  = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
const PIE_BARS    = ['bg-accent', 'bg-success', 'bg-warning', 'bg-purple', 'bg-danger']
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

const barOpts = unit => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { ...TOOLTIP, callbacks: { label: ctx => ` ${ctx.parsed.x.toLocaleString()} ${unit}` } },
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#4b5d72', font: { size: 11 } }, border: { display: false } },
    y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } }, border: { display: false } },
  },
})

function BarCard({ title, labels, values, color, unit, emptyText }) {
  return (
    <Card className="mb-3.5">
      <ChartTitle>{title}</ChartTitle>
      {labels.length ? (
        // height depends on the row count, so it stays inline (a dynamic Tailwind class would not be generated)
        <div style={{ height: `clamp(${Math.max(labels.length * 38 + 24, 300)}px, 42vh, 700px)` }}>
          <Bar
            data={{ labels, datasets: [{ data: values, backgroundColor: color, borderRadius: 4, barThickness: 18 }] }}
            options={barOpts(unit)}
          />
        </div>
      ) : <Empty>{emptyText}</Empty>}
    </Card>
  )
}

export default function Analytics() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [cmds,    setCmds]    = useState(null) // { top: [[cmd, count]], unused: [cmd] }

  useEffect(() => {
    Promise.all([getCommandStats(), getCommands()])
      .then(([{ stats }, list]) => {
        const all = [...list.publicCommands, ...list.groupCommands, ...list.adminCommands, ...list.ownerCommands]
        setCmds({
          top: Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 10),
          unused: all.filter(c => !c.cmd.some(k => stats[k])).map(c => c.cmd[0]),
        })
      })
      .catch(() => {}) // command usage is optional, the rest of the page still works
    getAnalytics()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />
  if (error)   return <ErrorState>{error}</ErrorState>
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

  return (
    <div>
      <PageHeader title="Analytics" sub="Message statistics across all groups and members." />

      <StatGrid>
        <StatCard label="Total Messages"  value={(totalMessages ?? 0).toLocaleString()} color="text-blue-500" />
        <StatCard label="Active Groups"   value={(activeGroups ?? 0).toLocaleString()}  color="text-success" />
        <StatCard label="Blocked Members" value={(blockedMembers ?? 0).toLocaleString()} color="text-danger" />
        <StatCard label="Total Groups"    value={(totalGroups ?? 0).toLocaleString()} />
        <StatCard label="Total Members"   value={(totalMembers ?? 0).toLocaleString()} />
        <StatCard label="Avg Msgs/Member" value={totalMembers ? Math.round(totalMessages / totalMembers).toLocaleString() : 0} />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        <Card>
          <ChartTitle>Message Type Distribution</ChartTitle>
          {typeData.length ? (
            <div className="h-[clamp(260px,32vh,560px)]">
              <PolarArea data={polarData} options={POLAR_OPTS} />
            </div>
          ) : <Empty>No message data yet.</Empty>}
        </Card>

        <Card>
          <ChartTitle>Type Breakdown (count)</ChartTitle>
          <div className="flex flex-col gap-2.5 mt-2">
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
                  <div className="flex justify-between text-[0.8rem] mb-1">
                    <span className="text-soft">{icon} {label}</span>
                    <span className="text-muted">{value.toLocaleString()} ({pct}%)</span>
                  </div>
                  <ProgressBar pct={pct} tone={PIE_BARS[i]} />
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <BarCard
        title="Top 10 Groups by Messages"
        labels={topGroups.map(g => g.name)}
        values={topGroups.map(g => g.messages)}
        color={BAR_COLORS}
        unit="msgs"
        emptyText="No group data yet."
      />

      {cmds && (
        <>
          <BarCard
            title="Top 10 Commands"
            labels={cmds.top.map(([c]) => c)}
            values={cmds.top.map(([, n]) => n)}
            color="#f59e0b"
            unit="uses"
            emptyText="No command usage recorded yet."
          />

          <Card className="mb-3.5">
            <ChartTitle>
              Never Used Commands{' '}
              <span className="ml-1 px-1.5 py-px rounded-lg bg-s2 text-[0.68rem] text-muted">{cmds.unused.length}</span>
            </ChartTitle>
            {cmds.unused.length ? (
              <div className="flex flex-wrap gap-[5px]">
                {cmds.unused.map(c => (
                  <span key={c} className="px-2 py-[3px] rounded-md border border-line bg-s2 text-soft font-mono text-[0.71rem]">{c}</span>
                ))}
              </div>
            ) : <Empty>Every command has been used.</Empty>}
          </Card>
        </>
      )}

      <BarCard
        title="Top 10 Members by Messages"
        labels={topMembers.map(m => m.name)}
        values={topMembers.map(m => m.messages)}
        color="#10b981"
        unit="msgs"
        emptyText="No member data yet."
      />
    </div>
  )
}
