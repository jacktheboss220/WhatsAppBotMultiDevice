import { useEffect, useState, useMemo } from 'react'
import { getCommands, toggleCommand } from '../lib/api.js'
import { useToast } from '../App.jsx'

const TYPE_FILTERS = ['all', 'public', 'group', 'admin', 'owner']

export default function Commands() {
  const toast = useToast()
  const [all,     setAll]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    getCommands()
      .then(d => setAll([
        ...(d.publicCommands || []).map(c => ({ ...c, type: 'public' })),
        ...(d.groupCommands  || []).map(c => ({ ...c, type: 'group' })),
        ...(d.adminCommands  || []).map(c => ({ ...c, type: 'admin' })),
        ...(d.ownerCommands  || []).map(c => ({ ...c, type: 'owner' })),
      ]))
      .catch(() => toast('Failed to load commands', false))
      .finally(() => setLoading(false))
  }, [])

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return all.filter(c => {
      if (filter !== 'all' && c.type !== filter) return false
      if (q && !c.cmd.join(' ').toLowerCase().includes(q) && !(c.desc || '').toLowerCase().includes(q)) return false
      return true
    })
  }, [all, filter, search])

  async function handleToggle(cmd, aliases, currentlyDisabled) {
    const newDisabled = !currentlyDisabled
    // Optimistic update
    setAll(prev => prev.map(c =>
      c.cmd.some(k => aliases.includes(k)) ? { ...c, disabledGlobally: newDisabled } : c
    ))
    try {
      await toggleCommand(cmd, newDisabled, aliases)
      toast(newDisabled ? `🚫 ${cmd} disabled` : `✅ ${cmd} enabled`)
    } catch (err) {
      // Revert
      setAll(prev => prev.map(c =>
        c.cmd.some(k => aliases.includes(k)) ? { ...c, disabledGlobally: currentlyDisabled } : c
      ))
      toast(err.message, false)
    }
  }

  const enabledCount  = all.filter(c => !c.disabledGlobally).length
  const disabledCount = all.filter(c =>  c.disabledGlobally).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Commands</h2>
          <p className="sub">
            {all.length} total &nbsp;·&nbsp;
            <span style={{ color: 'var(--success)' }}>{enabledCount} enabled</span>
            &nbsp;·&nbsp;
            <span style={{ color: 'var(--danger)' }}>{disabledCount} disabled</span>
          </p>
        </div>
        <div className="page-actions">
          <input
            className="search-input"
            placeholder="Search commands…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="chips">
        {TYPE_FILTERS.map(f => (
          <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state"><span className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          {rows.length ? (
            <table>
              <thead>
                <tr>
                  <th>Command(s)</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Usage</th>
                  <th>Enabled</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(c => (
                  <tr key={c.cmd[0]} className={c.disabledGlobally ? 'row-disabled' : ''}>
                    <td><strong style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{c.cmd.join(', ')}</strong></td>
                    <td><span className={`badge badge-${c.type}`}>{c.type}</span></td>
                    <td style={{ color: 'var(--text-soft)', maxWidth: 280 }}>{c.desc || '—'}</td>
                    <td><code>{c.usage || c.cmd[0]}</code></td>
                    <td>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={!c.disabledGlobally}
                          onChange={() => handleToggle(c.cmd[0], c.cmd, c.disabledGlobally)}
                        />
                        <span className="slider" />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No commands match your search.</p>
          )}
        </div>
      )}
    </div>
  )
}
