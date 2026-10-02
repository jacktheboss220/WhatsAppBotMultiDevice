import { useEffect, useState, useRef, useCallback } from 'react'
import { getLogs } from '../lib/api.js'
import { useWsEvent } from '../hooks/useWsEvent.js'
import { Btn, Chip, Chips, Empty, Loading, PageHeader } from '../components/ui.jsx'

const LEVELS = ['all', 'info', 'warn', 'error', 'telegram']

const LEVEL_META = {
  info:     { cls: 'bg-accent/10 text-accent',   label: 'INFO' },
  warn:     { cls: 'bg-warning/10 text-warning', label: 'WARN' },
  error:    { cls: 'bg-danger/10 text-danger',   label: 'ERROR' },
  telegram: { cls: 'bg-purple/10 text-purple',   label: 'TG' },
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false })
}

export default function Logs() {
  const [logs,       setLogs]       = useState([])
  const [level,      setLevel]      = useState('all')
  const [loading,    setLoading]    = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    getLogs({ limit: 200 })
      .then(d => setLogs(d.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLog = useCallback(data => {
    const entry = data.entry || data
    if (entry?.id) setLogs(prev => [...prev.slice(-499), entry])
  }, [])

  const handleSnapshot = useCallback(data => {
    if (data.logs?.length) setLogs(data.logs)
  }, [])

  useWsEvent('log', handleLog)
  useWsEvent('log_snapshot', handleSnapshot)

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const filtered = level === 'all' ? logs : logs.filter(e => e.level === level)

  return (
    <div>
      <PageHeader title="Logs" sub={`Live bot output — ${logs.length} entries buffered`}>
        <label className="flex items-center gap-[7px] text-[0.8rem] text-soft cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={e => setAutoScroll(e.target.checked)}
            className="size-3.5 accent-accent"
          />
          Auto-scroll
        </label>
        <Btn variant="sm" onClick={() => setLogs([])}>Clear</Btn>
      </PageHeader>

      <Chips>
        {LEVELS.map(l => (
          <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
            {l === 'telegram' ? 'Telegram' : l.charAt(0).toUpperCase() + l.slice(1)}
          </Chip>
        ))}
      </Chips>

      <div className="bg-s1 border border-line rounded-[14px] overflow-y-auto max-h-[clamp(400px,60vh,900px)] font-mono text-xs">
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <Empty>No log entries yet. Interact with the bot to generate logs.</Empty>
        ) : (
          filtered.map(entry => {
            const m = LEVEL_META[entry.level] || LEVEL_META.info
            return (
              <div key={entry.id} className="flex items-start gap-2.5 px-3.5 py-1.5 border-b border-line last:border-b-0 hover:bg-s2 transition-colors">
                <span className="text-muted whitespace-nowrap shrink-0 pt-px">{fmtTime(entry.ts)}</span>
                <span className={`shrink-0 px-1.5 py-px rounded text-[0.65rem] font-bold tracking-wide whitespace-nowrap ${m.cls}`}>{m.label}</span>
                <span className="text-soft break-all leading-relaxed">{entry.msg}</span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
