import { useEffect, useState, useMemo, useRef } from 'react'
import { getGroups, updateGroup } from '../lib/api.js'
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

function GroupCard({ grp, onUpdate, onAddBlock, onRemoveBlock }) {
  const addRef = useRef()

  return (
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
      </div>
    </div>
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
