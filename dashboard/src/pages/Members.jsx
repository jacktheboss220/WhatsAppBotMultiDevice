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
import {
  Badge, Btn, ChartTitle, Empty, Jid, Loading, Modal, ModalHeader, PageHeader, SearchInput,
  Chip, Chips, Table, TableWrap, Td, Th, Tr, cx,
} from '../components/ui.jsx'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

const SORTS = [
  { key: 'totalmsg',    label: 'Total ↕' },
  { key: 'texttotal',   label: '💬 Text' },
  { key: 'imagetotal',  label: '🖼️ Image' },
  { key: 'videototal',  label: '🎥 Video' },
  { key: 'stickertotal',label: '🎭 Sticker' },
  { key: 'pdftotal',    label: '📄 PDF' },
]

const COLUMNS = [['totalmsg','Total'],['texttotal','Text'],['imagetotal','Image'],['videototal','Video'],['stickertotal','Sticker'],['pdftotal','PDF']]

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
    <Modal onClose={onClose}>
      <ModalHeader
        title={member.username || 'Unknown User'}
        sub={<Jid>{member._id}</Jid>}
        onClose={onClose}
      />

      <ChartTitle>Message Profile</ChartTitle>
      <div className="h-[clamp(180px,24vh,360px)] mb-[18px]">
        <Radar data={radarData} options={radarOpts} />
      </div>

      <ChartTitle>All Fields</ChartTitle>
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-1.5 mb-4">
        {entries.map(([key, val]) => (
          <div key={key} className="flex flex-col gap-[3px] bg-s2 border border-line rounded-md px-2.5 py-2">
            <span className="font-mono text-[0.62rem] font-semibold text-muted uppercase tracking-wide">{key}</span>
            <span className="font-mono text-[0.8rem] break-all">{fmtVal(val)}</span>
          </div>
        ))}
      </div>

      {Array.isArray(member.warning) && member.warning.length > 0 && (
        <>
          <ChartTitle>Warnings</ChartTitle>
          <div className="mb-4">
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Group JID</Th>
                    <Th className="text-right">Count</Th>
                  </tr>
                </thead>
                <tbody>
                  {member.warning.map((w, i) => (
                    <Tr key={i}>
                      <Td><Jid>{w.group || w.groupJid || '—'}</Jid></Td>
                      <Td className={cx('text-right', w.count >= 3 && 'text-danger')}>
                        <strong>{w.count}</strong>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-2 pt-3.5 border-t border-line">
        {member.isBlock
          ? <Btn variant="sm" onClick={() => onAction(member._id, 'unblock')}>Unblock</Btn>
          : <Btn variant="smDanger" onClick={() => onAction(member._id, 'block')}>Block</Btn>
        }
        <Btn variant="sm" onClick={() => onAction(member._id, 'resetWarnings')}>Reset Warns</Btn>
        <Btn variant="sm" onClick={() => onAction(member._id, 'resetMsgCount')}>Reset Count</Btn>
        <Btn variant="smAccent" onClick={() => onDM(member._id)}>✉️ Message</Btn>
      </div>
    </Modal>
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
  const reqId = useRef(0)

  function load(p = page, s = sort, o = order, q = search) {
    const id = ++reqId.current
    setLoading(true)
    getMembers({ page: p, limit: LIMIT, sort: s, order: o, search: q })
      .then(d => { if (id === reqId.current) setData(d) })
      .catch(() => { if (id === reqId.current) toast('Failed to load members', false) })
      .finally(() => { if (id === reqId.current) setLoading(false) })
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

  const arrow = field => (sort !== field ? <span className="opacity-20">↕</span> : order === 'desc' ? '↓' : '↑')

  const pages = data ? Math.ceil(data.total / LIMIT) : 0

  return (
    <div>
      <PageHeader title="Members" sub={data ? `${data.total.toLocaleString()} members found` : 'Loading…'}>
        <SearchInput placeholder="Search by JID or name…" value={search} onChange={e => handleSearch(e.target.value)} />
      </PageHeader>

      <Chips>
        {SORTS.map(s => (
          <Chip key={s.key} active={sort === s.key} onClick={() => handleSort(s.key)}>{s.label}</Chip>
        ))}
      </Chips>

      <TableWrap>
        {loading ? (
          <Loading />
        ) : !data?.members?.length ? (
          <Empty>No members found.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>JID</Th>
                <Th>Name</Th>
                {COLUMNS.map(([f, l]) => (
                  <Th key={f} className="cursor-pointer select-none hover:text-soft" onClick={() => handleSort(f)}>
                    {l} {arrow(f)}
                  </Th>
                ))}
                <Th>Status</Th>
                <Th>Warns</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.members.map(m => (
                <Tr
                  key={m._id}
                  className={cx('cursor-pointer', m.isBlock && 'bg-danger/[0.04]')}
                  onClick={() => setSelectedMember(m)}
                >
                  <Td><Jid>{m._id}</Jid></Td>
                  <Td className="text-soft">{m.username || '—'}</Td>
                  <Td>{m.totalmsg      || 0}</Td>
                  <Td>{m.texttotal     || 0}</Td>
                  <Td>{m.imagetotal    || 0}</Td>
                  <Td>{m.videototal    || 0}</Td>
                  <Td>{m.stickertotal  || 0}</Td>
                  <Td>{m.pdftotal      || 0}</Td>
                  <Td>
                    <Badge tone={m.isBlock ? 'err' : 'on'}>{m.isBlock ? 'Blocked' : 'Active'}</Badge>
                  </Td>
                  <Td>{(m.warning || []).length}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-[5px]" onClick={e => e.stopPropagation()}>
                      {m.isBlock
                        ? <Btn variant="sm" onClick={() => handleAction(m._id, 'unblock')}>Unblock</Btn>
                        : <Btn variant="smDanger" onClick={() => handleAction(m._id, 'block')}>Block</Btn>
                      }
                      <Btn variant="sm" onClick={() => handleAction(m._id, 'resetWarnings')}>Reset Warns</Btn>
                      <Btn variant="sm" onClick={() => handleAction(m._id, 'resetMsgCount')}>Reset Count</Btn>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </TableWrap>

      {pages > 1 && (
        <div className="flex items-center gap-3 py-3.5 text-[0.78rem] text-muted">
          <button
            className="px-3.5 py-1.5 bg-s1 border border-line rounded-md text-soft text-[0.78rem] font-medium hover:enabled:border-accent/30 hover:enabled:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition"
            disabled={page <= 1}
            onClick={() => handlePage(page - 1)}
          >← Prev</button>
          <span>Page {page} / {pages} ({data?.total?.toLocaleString()} total)</span>
          <button
            className="px-3.5 py-1.5 bg-s1 border border-line rounded-md text-soft text-[0.78rem] font-medium hover:enabled:border-accent/30 hover:enabled:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition"
            disabled={page >= pages}
            onClick={() => handlePage(page + 1)}
          >Next →</button>
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
