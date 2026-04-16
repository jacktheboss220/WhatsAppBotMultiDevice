import { useEffect, useState, useRef } from 'react'
import { getMembers, memberAction } from '../lib/api.js'
import { useToast } from '../App.jsx'

const SORTS = [
  { key: 'totalmsg',    label: 'Total ↕' },
  { key: 'texttotal',   label: '💬 Text' },
  { key: 'imagetotal',  label: '🖼️ Image' },
  { key: 'videototal',  label: '🎥 Video' },
  { key: 'stickertotal',label: '🎭 Sticker' },
  { key: 'pdftotal',    label: '📄 PDF' },
]

const LIMIT = 50

export default function Members() {
  const toast = useToast()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [sort,    setSort]    = useState('totalmsg')
  const [order,   setOrder]   = useState('desc')
  const [search,  setSearch]  = useState('')
  const debounce = useRef(null)

  function load(p = page, s = sort, o = order, q = search) {
    setLoading(true)
    getMembers({ page: p, limit: LIMIT, sort: s, order: o, search: q })
      .then(setData)
      .catch(() => toast('Failed to load members', false))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function handleSearch(val) {
    setSearch(val)
    setPage(1)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => load(1, sort, order, val), 380)
  }

  function handleSort(key) {
    const newOrder = sort === key ? (order === 'desc' ? 'asc' : 'desc') : 'desc'
    setSort(key); setOrder(newOrder); setPage(1)
    load(1, key, newOrder, search)
  }

  function handlePage(p) { setPage(p); load(p, sort, order, search) }

  async function handleAction(jid, action) {
    try {
      await memberAction(jid, action)
      toast(`Done: ${action}`)
      load()
    } catch (err) { toast(err.message, false) }
  }

  function Arrow({ field }) {
    if (sort !== field) return <span style={{ opacity: 0.22 }}>↕</span>
    return order === 'desc' ? '↓' : '↑'
  }

  const pages = data ? Math.ceil(data.total / LIMIT) : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Members</h2>
          <p className="sub">{data ? `${data.total.toLocaleString()} members found` : 'Loading…'}</p>
        </div>
        <div className="page-actions">
          <input
            className="search-input"
            placeholder="Search by JID or name…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="chips">
        {SORTS.map(s => (
          <button key={s.key} className={`chip ${sort === s.key ? 'active' : ''}`} onClick={() => handleSort(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-state"><span className="spinner" /></div>
        ) : !data?.members?.length ? (
          <p className="empty-state">No members found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>JID</th>
                <th>Name</th>
                {[['totalmsg','Total'],['texttotal','Text'],['imagetotal','Image'],['videototal','Video'],['stickertotal','Sticker'],['pdftotal','PDF']].map(([f,l]) => (
                  <th key={f} className="sortable" onClick={() => handleSort(f)}>
                    {l} <Arrow field={f} />
                  </th>
                ))}
                <th>Status</th>
                <th>Warns</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map(m => (
                <tr key={m._id} className={m.isBlock ? 'row-blocked' : ''}>
                  <td><code className="jid-sm">{m._id}</code></td>
                  <td style={{ color: 'var(--text-soft)' }}>{m.username || '—'}</td>
                  <td>{m.totalmsg    || 0}</td>
                  <td>{m.texttotal  || 0}</td>
                  <td>{m.imagetotal || 0}</td>
                  <td>{m.videototal || 0}</td>
                  <td>{m.stickertotal || 0}</td>
                  <td>{m.pdftotal   || 0}</td>
                  <td>
                    <span className={`badge ${m.isBlock ? 'badge-err' : 'badge-on'}`}>
                      {m.isBlock ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td>{(m.warning || []).length}</td>
                  <td>
                    <div className="actions">
                      {m.isBlock
                        ? <button className="btn-sm" onClick={() => handleAction(m._id, 'unblock')}>Unblock</button>
                        : <button className="btn-sm danger" onClick={() => handleAction(m._id, 'block')}>Block</button>
                      }
                      <button className="btn-sm" onClick={() => handleAction(m._id, 'resetWarnings')}>Reset Warns</button>
                      <button className="btn-sm" onClick={() => handleAction(m._id, 'resetMsgCount')}>Reset Count</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => handlePage(page - 1)}>← Prev</button>
          <span>Page {page} / {pages} &nbsp;({data?.total?.toLocaleString()} total)</span>
          <button disabled={page >= pages} onClick={() => handlePage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}
