import { useEffect, useState, useRef, useCallback } from 'react'
import { getLogs } from '../lib/api.js'
import { useWsEvent } from '../hooks/useWsEvent.js'

const LEVELS = ['all', 'info', 'warn', 'error', 'telegram']

const LEVEL_META = {
  info:     { bg: 'rgba(14,165,233,0.12)',   color: '#0ea5e9', label: 'INFO' },
  warn:     { bg: 'rgba(245,158,11,0.12)',   color: '#f59e0b', label: 'WARN' },
  error:    { bg: 'rgba(239,68,68,0.12)',    color: '#ef4444', label: 'ERROR' },
  telegram: { bg: 'rgba(139,92,246,0.12)',   color: '#8b5cf6', label: 'TG' },
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
      <div className="page-header">
        <div>
          <h2>Logs</h2>
          <p className="sub">Live bot output — {logs.length} entries buffered</p>
        </div>
        <div className="page-actions">
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', color: 'var(--text-soft)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
            />
            Auto-scroll
          </label>
          <button className="btn-sm" onClick={() => setLogs([])}>Clear</button>
        </div>
      </div>

      <div className="chips">
        {LEVELS.map(l => (
          <button key={l} className={`chip ${level === l ? 'active' : ''}`} onClick={() => setLevel(l)}>
            {l === 'telegram' ? 'Telegram' : l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}
      </div>

      <div className="log-wrap">
        {loading ? (
          <div className="loading-state"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <p className="empty-state">No log entries yet. Interact with the bot to generate logs.</p>
        ) : (
          filtered.map(entry => {
            const m = LEVEL_META[entry.level] || LEVEL_META.info
            return (
              <div key={entry.id} className="log-row">
                <span className="log-time">{fmtTime(entry.ts)}</span>
                <span className="log-badge" style={{ background: m.bg, color: m.color }}>{m.label}</span>
                <span className="log-msg">{entry.msg}</span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
