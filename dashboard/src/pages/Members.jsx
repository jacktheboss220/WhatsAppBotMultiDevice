import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import { getMembers, memberAction } from '../lib/api.js'
import { useToast } from '../App.jsx'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

const SORTS = [
  { key: 'totalmsg',    label: 'Total ↕' },
  { key: 'texttotal',   label: '💬 Text' },
  { key: 'imagetotal',  label: '🖼️ Image' },
  { key: 'videototal',  label: '🎥 Video' },
  { key: 'stickertotal',label: '🎭 Sticker' },
  { key: 'pdftotal',    label: '📄 PDF' },
]

const LIMIT = 50

const TYPE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

const MODAL_TOOLTIP = {
  backgroundColor: '#0d1420',
  borderColor: 'rgba(255,255,255,0.12)',
  borderWidth: 1,
  titleColor: '#94a3b8',
  bodyColor: '#e2e8f0',
  padding: 8,
  cornerRadius: 6,
  boxWidth: 8,
  boxHeight: 8,
}

const SKIP_FIELDS = new Set(['texttotal', 'imagetotal', 'videototal', 'stickertotal', 'pdftotal', 'warning'])

function fmtVal(val) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (Array.isArray(val)) return val.length === 0 ? '[ empty ]' : `[ ${val.length} item${val.length !== 1 ? 's' : ''} ]`
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function MemberModal({ member, onClose, onAction, onDM }) {
  const radarData = {
    labels: ['Text', 'Image', 'Video', 'Sticker', 'PDF'],
    datasets: [{
      label: 'Messages',
      data: [
        member.texttotal    || 0,
        member.imagetotal   || 0,
        member.videototal   || 0,
        member.stickertotal || 0,
        member.pdftotal     || 0,
      ],
      backgroundColor: 'rgba(59,130,246,0.15)',
      borderColor: '#0ea5e9',
      pointBackgroundColor: TYPE_COLORS,
      pointBorderColor: '#0d1420',
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
      fill: true,
    }],
  }

  const radarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...MODAL_TOOLTIP, callbacks: { label: ctx => ` ${ctx.parsed.r.toLocaleString()} msgs` } },
    },
    scales: {
      r: {
        grid: { color: 'rgba(255,255,255,0.08)' },
        angleLines: { color: 'rgba(255,255,255,0.08)' },
        ticks: { color: '#4b5d72', font: { size: 8 }, backdropColor: 'transparent', maxTicksLimit: 4 },
        pointLabels: { color: '#94a3b8', font: { size: 10 } },
      },
    },
  }

  const entries = Object.entries(member).filter(([k]) => !SKIP_FIELDS.has(k))

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{member.username || 'Unknown User'}</div>
            <code className="jid-sm">{member._id}</code>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="chart-title" style={{ marginBottom: 8 }}>Message Profile</p>
        <div style={{ height: 'clamp(180px, 24vh, 360px)', marginBottom: 18 }}>
          <Radar data={radarData} options={radarOpts} />
        </div>

        <p className="chart-title" style={{ marginBottom: 8 }}>All Fields</p>
        <div className="modal-fields">
          {entries.map(([key, val]) => (
            <div key={key} className="modal-field">
              <span className="modal-field-key">{key}</span>
              <span className="modal-field-val">{fmtVal(val)}</span>
            </div>
          ))}
        </div>

        {Array.isArray(member.warning) && member.warning.length > 0 && (
          <>
            <p className="chart-title" style={{ marginBottom: 8, marginTop: 4 }}>Warnings</p>
            <div className="table-wrap" style={{ marginBottom: 16 }}>
              <table>
                <thead>
                  <tr>
                    <th>Group JID</th>
                    <th style={{ textAlign: 'right' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {member.warning.map((w, i) => (
                    <tr key={i}>
                      <td><code className="jid-sm">{w.group || w.groupJid || '—'}</code></td>
                      <td style={{ textAlign: 'right', color: w.count >= 3 ? '#ef4444' : 'var(--text)' }}>
                        <strong>{w.count}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="modal-actions">
          {member.isBlock
            ? <button className="btn-sm" onClick={() => onAction(member._id, 'unblock')}>Unblock</button>
            : <button className="btn-sm danger" onClick={() => onAction(member._id, 'block')}>Block</button>
          }
          <button className="btn-sm" onClick={() => onAction(member._id, 'resetWarnings')}>Reset Warns</button>
          <button className="btn-sm" onClick={() => onAction(member._id, 'resetMsgCount')}>Reset Count</button>
          <button className="btn-sm" style={{ background: 'rgba(14,165,233,0.12)', color: '#0ea5e9', borderColor: 'rgba(14,165,233,0.3)' }} onClick={() => onDM(member._id)}>✉️ Message</button>
        </div>
      </div>
    </div>
  )
}

export default function Members() {
  const toast    = useToast()
  const navigate = useNavigate()
  const [data,           setData]           = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [page,           setPage]           = useState(1)
  const [sort,           setSort]           = useState('totalmsg')
  const [order,          setOrder]          = useState('desc')
  const [search,         setSearch]         = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
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
                <tr
                  key={m._id}
                  className={m.isBlock ? 'row-blocked' : ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedMember(m)}
                >
                  <td><code className="jid-sm">{m._id}</code></td>
                  <td style={{ color: '#94a3b8' }}>{m.username || '—'}</td>
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
                    <div className="actions" onClick={e => e.stopPropagation()}>
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

      {selectedMember && (
        <MemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onAction={async (jid, action) => {
            await handleAction(jid, action)
            setSelectedMember(null)
          }}
          onDM={jid => { setSelectedMember(null); navigate(`/dm?jid=${encodeURIComponent(jid)}`) }}
        />
      )}
    </div>
  )
}
