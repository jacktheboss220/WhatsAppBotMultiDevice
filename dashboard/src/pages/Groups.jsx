import { useEffect, useState, useMemo, useRef } from 'react'
import { getGroups, updateGroup, getGroupChatHistory } from '../lib/api.js'
import { useToast } from '../App.jsx'

const SORTS = [
  { key: 'active',    label: 'Active First' },
  { key: 'name-asc',  label: 'Name A→Z' },
  { key: 'name-desc', label: 'Name Z→A' },
  { key: 'msg-desc',  label: 'Most Messages' },
  { key: 'msg-asc',   label: 'Least Messages' },
]

const TOGGLES = [
  { field: 'isBotOn',         label: 'Bot Active' },
  { field: 'isChatBotOn',     label: 'Chatbot' },
  { field: 'isImgOn',         label: 'Image Search' },
  { field: 'isAutoStickerOn', label: 'Auto-Sticker' },
  { field: 'is91Only',        label: 'India-Only (+91)' },
]

const HOUR_TABS = [1, 6, 12, 24]

function fmtTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
    ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function ChatHistoryModal({ grp, onClose }) {
  const [hours, setHours]     = useState(24)
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const bottomRef             = useRef()

  useEffect(() => {
    setLoading(true)
    setError(null)
    getGroupChatHistory(grp._id, hours)
      .then(data => { setLogs(data); setLoading(false) })
      .catch(e  => { setError(e.message); setLoading(false) })
  }, [grp._id, hours])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--card)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '640px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>{grp.grpName || 'Unnamed Group'}</div>
            <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '2px' }}>Chat History</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '20px', lineHeight: 1, opacity: 0.6, color: 'inherit',
              padding: '4px 8px',
            }}
          >✕</button>
        </div>

        {/* Hour filter tabs */}
        <div style={{
          display: 'flex', gap: '6px', padding: '10px 16px',
          borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          {HOUR_TABS.map(h => (
            <button
              key={h}
              onClick={() => setHours(h)}
              style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '13px',
                border: '1px solid var(--border)', cursor: 'pointer',
                background: hours === h ? 'var(--accent)' : 'transparent',
                color: hours === h ? '#fff' : 'inherit',
                fontWeight: hours === h ? 600 : 400,
              }}
            >
              Last {h}h
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.5, alignSelf: 'center' }}>
            {logs.length} messages
          </span>
        </div>

        {/* Message list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
              <span className="spinner" />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger, #e74c3c)' }}>
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
              No messages in the last {hours}h
            </div>
          ) : (
            logs.map((m, i) => {
              const name = m.senderName || m.sender?.split('@')[0] || 'Unknown'
              return (
                <div key={m._id || i} style={{
                  background: 'var(--bg)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  borderLeft: '3px solid var(--accent)',
                }}>
                  {m.replyTo && (
                    <div style={{
                      fontSize: '12px', opacity: 0.6,
                      borderLeft: '2px solid var(--border)',
                      paddingLeft: '8px', marginBottom: '4px',
                      fontStyle: 'italic',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      ↩ {m.replyTo.senderName || m.replyTo.sender?.split('@')[0] || '?'}: {m.replyTo.text}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--accent)', flexShrink: 0 }}>
                      {name}
                    </span>
                    <span style={{ fontSize: '11px', opacity: 0.45, flexShrink: 0 }}>
                      {fmtTime(m.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', marginTop: '2px', wordBreak: 'break-word' }}>
                    {m.text}
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

function GroupCard({ grp, onUpdate, onAddBlock, onRemoveBlock }) {
  const addRef = useRef()
  const [showHistory, setShowHistory] = useState(false)

  return (
    <>
      <div className="grp-card">
        <div className="grp-header">
          <div style={{ minWidth: 0 }}>
            <h3>{grp.grpName || 'Unnamed Group'}</h3>
            <div className="jid">{grp._id}</div>
          </div>
          <span className={`badge ${grp.isBotOn ? 'badge-on' : 'badge-off'}`} style={{ flexShrink: 0 }}>
            {grp.isBotOn ? 'ON' : 'OFF'}
          </span>
        </div>

        {grp.desc && <p className="grp-desc">{grp.desc}</p>}

        <div className="toggle-grid">
          {TOGGLES.map(({ field, label }) => (
            <div key={field} className="toggle-row">
              <span>{label}</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={!!grp[field]}
                  onChange={e => onUpdate(grp._id, field, e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
          ))}
        </div>

        <div className="blocked-section">
          <p className="blocked-label">Blocked Commands <span className="count">{(grp.cmdBlocked || []).length}</span></p>
          <div className="chips-row">
            {(grp.cmdBlocked || []).map(cmd => (
              <span key={cmd} className="chip-cmd">
                {cmd}
                <button onClick={() => onRemoveBlock(grp._id, cmd)} title="Unblock">✕</button>
              </span>
            ))}
            <div className="add-blocked">
              <input ref={addRef} type="text" placeholder="add command…" />
              <button className="btn-sm" onClick={() => {
                const v = addRef.current?.value?.trim().toLowerCase()
                if (v) { onAddBlock(grp._id, v); addRef.current.value = '' }
              }}>Add</button>
            </div>
          </div>
        </div>

        <div className="grp-meta">
          <span>💬 {grp.totalMsgCount || 0} messages</span>
          <span>👥 {(grp.members || []).length} members</span>
          <button
            className="btn-sm"
            onClick={() => setShowHistory(true)}
            style={{ marginLeft: 'auto' }}
          >
            📋 Chat History
          </button>
        </div>
      </div>

      {showHistory && (
        <ChatHistoryModal grp={grp} onClose={() => setShowHistory(false)} />
      )}
    </>
  )
}

export default function Groups() {
  const toast = useToast()
  const [groups,  setGroups]  = useState([])
  const [loading, setLoading] = useState(true)
  const [sort,    setSort]    = useState('active')
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    getGroups()
      .then(setGroups)
      .catch(() => toast('Failed to load groups', false))
      .finally(() => setLoading(false))
  }, [])

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    let list = groups.filter(g => !q || (g.grpName || '').toLowerCase().includes(q) || g._id.includes(q))
    if (sort === 'active')    list = [...list].sort((a, b) => (b.isBotOn ? 1 : 0) - (a.isBotOn ? 1 : 0))
    if (sort === 'name-asc')  list = [...list].sort((a, b) => (a.grpName || '').localeCompare(b.grpName || ''))
    if (sort === 'name-desc') list = [...list].sort((a, b) => (b.grpName || '').localeCompare(a.grpName || ''))
    if (sort === 'msg-desc')  list = [...list].sort((a, b) => (b.totalMsgCount || 0) - (a.totalMsgCount || 0))
    if (sort === 'msg-asc')   list = [...list].sort((a, b) => (a.totalMsgCount || 0) - (b.totalMsgCount || 0))
    return list
  }, [groups, sort, search])

  async function handleUpdate(jid, field, val) {
    setGroups(prev => prev.map(g => g._id === jid ? { ...g, [field]: val } : g))
    try {
      await updateGroup(jid, { [field]: val })
      toast(`${field} → ${val}`)
    } catch (err) {
      setGroups(prev => prev.map(g => g._id === jid ? { ...g, [field]: !val } : g))
      toast(err.message, false)
    }
  }

  async function handleAddBlock(jid, cmd) {
    const grp = groups.find(g => g._id === jid)
    if (!grp) return
    const updated = [...new Set([...(grp.cmdBlocked || []), cmd])]
    setGroups(prev => prev.map(g => g._id === jid ? { ...g, cmdBlocked: updated } : g))
    try {
      await updateGroup(jid, { cmdBlocked: updated })
      toast(`Blocked: ${cmd}`)
    } catch (err) {
      setGroups(prev => prev.map(g => g._id === jid ? { ...g, cmdBlocked: grp.cmdBlocked } : g))
      toast(err.message, false)
    }
  }

  async function handleRemoveBlock(jid, cmd) {
    const grp = groups.find(g => g._id === jid)
    if (!grp) return
    const updated = (grp.cmdBlocked || []).filter(c => c !== cmd)
    setGroups(prev => prev.map(g => g._id === jid ? { ...g, cmdBlocked: updated } : g))
    try {
      await updateGroup(jid, { cmdBlocked: updated })
      toast(`Unblocked: ${cmd}`)
    } catch (err) {
      setGroups(prev => prev.map(g => g._id === jid ? { ...g, cmdBlocked: grp.cmdBlocked } : g))
      toast(err.message, false)
    }
  }

  const activeCount = groups.filter(g => g.isBotOn).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Groups</h2>
          <p className="sub">{groups.length} total · <span style={{ color: 'var(--success)' }}>{activeCount} active</span></p>
        </div>
        <div className="page-actions">
          <input
            className="search-input"
            placeholder="Search groups…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="chips">
        {SORTS.map(s => (
          <button key={s.key} className={`chip ${sort === s.key ? 'active' : ''}`} onClick={() => setSort(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state"><span className="spinner" /></div>
      ) : rows.length ? (
        <div className="group-grid">
          {rows.map(g => (
            <GroupCard
              key={g._id}
              grp={g}
              onUpdate={handleUpdate}
              onAddBlock={handleAddBlock}
              onRemoveBlock={handleRemoveBlock}
            />
          ))}
        </div>
      ) : (
        <p className="empty-state">No groups found.</p>
      )}
    </div>
  )
}
