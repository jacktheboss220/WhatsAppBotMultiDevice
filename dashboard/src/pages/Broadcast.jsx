import { useEffect, useState, useMemo } from 'react'
import { getGroups, broadcast } from '../lib/api.js'
import { useToast } from '../App.jsx'

export default function Broadcast() {
  const toast   = useToast()
  const [groups,   setGroups]   = useState([])
  const [message,  setMessage]  = useState('')
  const [mode,     setMode]     = useState('active') // 'active' | 'all' | 'custom'
  const [selected, setSelected] = useState(new Set())
  const [grpSearch,setGrpSearch]= useState('')
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)

  useEffect(() => {
    getGroups().then(setGroups).catch(() => toast('Failed to load groups', false))
  }, [])

  const activeGroups  = useMemo(() => groups.filter(g => g.isBotOn),  [groups])
  const filteredGroups = useMemo(() => {
    const q = grpSearch.toLowerCase()
    return groups.filter(g => !q || (g.grpName || '').toLowerCase().includes(q) || g._id.includes(q))
  }, [groups, grpSearch])

  function toggleSelect(jid) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(jid)) next.delete(jid); else next.add(jid)
      return next
    })
  }

  function targetCount() {
    if (mode === 'active') return activeGroups.length
    if (mode === 'all')    return groups.length
    return selected.size
  }

  async function handleSend() {
    if (!message.trim()) return toast('Message cannot be empty.', false)
    if (targetCount() === 0) return toast('No target groups selected.', false)

    const targetJids = mode === 'active' ? activeGroups.map(g => g._id)
                     : mode === 'all'    ? groups.map(g => g._id)
                     : [...selected]

    setLoading(true)
    setResult(null)
    try {
      const res = await broadcast(message.trim(), targetJids)
      setResult(res)
      toast(`Sent to ${res.sent}/${res.total} groups`)
      if (res.sent > 0) setMessage('')
    } catch (err) {
      toast(err.message, false)
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Broadcast</h2>
          <p className="sub">Send a message to multiple groups at once.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        {/* Left: Message */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <p className="card-title">Message</p>
                <p className="card-sub">This text will be sent as-is to all selected groups.</p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{message.length} / 4096</span>
            </div>
            <textarea
              className="form-textarea"
              placeholder="Type your broadcast message here…"
              value={message}
              maxLength={4096}
              onChange={e => setMessage(e.target.value)}
              style={{ minHeight: 160 }}
            />
          </div>

          {/* Preview */}
          {message.trim() && (
            <div className="card">
              <p className="card-title" style={{ marginBottom: 10 }}>Preview</p>
              <div style={{
                background: 'var(--surface-2)',
                borderRadius: 'var(--r)',
                padding: '12px 14px',
                fontSize: '0.85rem',
                color: 'var(--text-soft)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                borderLeft: '3px solid var(--accent)',
              }}>
                {message}
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={loading || !message.trim() || targetCount() === 0}
            style={{ alignSelf: 'flex-start', padding: '10px 24px' }}
          >
            {loading
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Sending…</>
              : `📢 Send to ${targetCount()} group${targetCount() !== 1 ? 's' : ''}`
            }
          </button>

          {result && !result.error && (
            <div className={`broadcast-result ${result.failed > 0 ? '' : 'ok'}`}>
              <strong>✅ Sent to {result.sent}</strong> / {result.total} groups
              {result.failed > 0 && <span style={{ color: 'var(--warning)', marginLeft: 8 }}>· {result.failed} failed</span>}
            </div>
          )}
          {result?.error && (
            <div className="broadcast-result err">❌ {result.error}</div>
          )}
        </div>

        {/* Right: Target selection */}
        <div className="card" style={{ position: 'sticky', top: 0 }}>
          <p className="card-title" style={{ marginBottom: 12 }}>Target Groups</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {[
              { key: 'active', label: `Active groups (${activeGroups.length})`, sub: 'Only groups where bot is ON' },
              { key: 'all',    label: `All groups (${groups.length})`,          sub: 'Every group in the database' },
              { key: 'custom', label: 'Custom selection',                        sub: 'Pick specific groups below' },
            ].map(({ key, label, sub }) => (
              <label key={key} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: mode === key ? 'var(--accent-dim)' : 'var(--surface-2)', borderRadius: 'var(--r-sm)', border: `1px solid ${mode === key ? 'var(--accent-bdr)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.12s' }}>
                <input type="radio" name="mode" value={key} checked={mode === key} onChange={() => { setMode(key); setSelected(new Set()) }} style={{ accentColor: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
                </div>
              </label>
            ))}
          </div>

          {mode === 'custom' && (
            <>
              <input
                className="search-input"
                style={{ width: '100%', borderRadius: 'var(--r-sm)', marginBottom: 8 }}
                placeholder="Search groups…"
                value={grpSearch}
                onChange={e => setGrpSearch(e.target.value)}
              />
              <div className="group-picker">
                {filteredGroups.map(g => (
                  <div key={g._id} className="group-picker-row" onClick={() => toggleSelect(g._id)}>
                    <input type="checkbox" checked={selected.has(g._id)} onChange={() => toggleSelect(g._id)} onClick={e => e.stopPropagation()} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.81rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.grpName || 'Unnamed Group'}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                        {g.isBotOn ? '✅ Active' : '⭕ Inactive'} · {g.totalMsgCount || 0} msgs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selected.size > 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  {selected.size} group{selected.size !== 1 ? 's' : ''} selected
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
