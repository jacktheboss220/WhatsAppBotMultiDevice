import { useEffect, useState, useMemo, useRef } from 'react'
import { getGroups, updateGroup, getGroupChatHistory } from '../lib/api.js'
import { useToast } from '../App.jsx'
import {
  Badge, Btn, Chip, Chips, Empty, ErrorState, Jid, Loading, Modal, ModalHeader, PageHeader,
  SearchInput, Spinner, StatCard, StatGrid, Textarea, Toggle, cx,
} from '../components/ui.jsx'

const SORTS = [
  { key: 'active',    label: 'Active First' },
  { key: 'name-asc',  label: 'Name A→Z' },
  { key: 'name-desc', label: 'Name Z→A' },
  { key: 'msg-desc',  label: 'Most Messages' },
  { key: 'msg-asc',   label: 'Least Messages' },
]

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
]

const TOGGLES = [
  { field: 'isBotOn',         label: 'Bot Active' },
  { field: 'isChatBotOn',     label: 'Chatbot' },
  { field: 'isImgOn',         label: 'Image Search' },
  { field: 'isAutoStickerOn', label: 'Auto-Sticker' },
  { field: 'is91Only',        label: 'India-Only (+91)' },
  { field: 'isRankNotifOn',   label: 'Rank Notifications' },
]

const TYPE_TOTALS = [
  ['Text', 'texttotal'], ['Images', 'imagetotal'], ['Videos', 'videototal'],
  ['Stickers', 'stickertotal'], ['PDFs', 'pdftotal'],
]

const HOUR_TABS = [1, 6, 12, 24]

const fmt = n => (n || 0).toLocaleString()
const sum = (members, key) => (members || []).reduce((n, m) => n + (m[key] || 0), 0)

function fmtTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
    ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

/* ── Chat history modal ─────────────────────────────────────────────────────── */
function ChatHistoryModal({ grp, onClose }) {
  const [hours, setHours]     = useState(24)
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const bottomRef             = useRef()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getGroupChatHistory(grp._id, hours)
      .then(data => { if (!cancelled) { setLogs(data); setLoading(false) } })
      .catch(e  => { if (!cancelled) { setError(e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [grp._id, hours])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <Modal onClose={onClose} maxWidth="max-w-[640px]">
      <ModalHeader
        title={grp.grpName || 'Unnamed Group'}
        sub={<div className="text-xs text-muted">Chat History</div>}
        onClose={onClose}
      />

      <div className="flex flex-wrap items-center gap-1.5 pb-3 mb-3 border-b border-line">
        {HOUR_TABS.map(h => (
          <Chip key={h} active={hours === h} onClick={() => setHours(h)}>Last {h}h</Chip>
        ))}
        <span className="ml-auto text-xs text-muted">{logs.length} messages</span>
      </div>

      <div className="flex flex-col gap-1.5 max-h-[55vh] overflow-y-auto">
        {loading ? (
          <div className="py-10 text-center"><Spinner /></div>
        ) : error ? (
          <ErrorState>{error}</ErrorState>
        ) : logs.length === 0 ? (
          <Empty>No messages in the last {hours}h</Empty>
        ) : (
          logs.map((m, i) => {
            const name = m.senderName || m.sender?.split('@')[0] || 'Unknown'
            return (
              <div key={m._id || i} className="bg-bg rounded-lg px-3 py-2 border-l-[3px] border-accent">
                {m.replyTo && (
                  <div className="text-xs text-soft/60 border-l-2 border-line pl-2 mb-1 italic truncate">
                    ↩ {m.replyTo.senderName || m.replyTo.sender?.split('@')[0] || '?'}: {m.replyTo.text}
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.8rem] font-semibold text-accent shrink-0">{name}</span>
                  <span className="text-[0.7rem] text-muted shrink-0">{fmtTime(m.timestamp)}</span>
                </div>
                <div className="text-sm mt-0.5 break-words">{m.text}</div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </Modal>
  )
}

/* ── Small pieces ───────────────────────────────────────────────────────────── */
function Section({ label, children, className }) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <p className="text-[0.68rem] font-semibold text-muted uppercase tracking-widest">{label}</p>
      {children}
    </div>
  )
}

function TextField({ label, value, placeholder, onSave }) {
  const [text, setText] = useState(value || '')
  const dirty = text !== (value || '')
  return (
    <Section label={label}>
      <Textarea
        rows={4}
        value={text}
        placeholder={placeholder}
        maxLength={2000}
        onChange={e => setText(e.target.value)}
        className="min-h-[96px] text-[0.8rem] px-2.5 py-2"
      />
      <div>
        <Btn variant="sm" disabled={!dirty} onClick={() => onSave(text)}>Save</Btn>
      </div>
    </Section>
  )
}

function MiniStat({ value, label }) {
  return (
    <div className="bg-s2 rounded-md px-2.5 py-2">
      <strong className="block text-[0.9rem]">{value}</strong>
      <span className="text-[0.66rem] text-muted">{label}</span>
    </div>
  )
}

/* ── One group ──────────────────────────────────────────────────────────────── */
function GroupRow({ grp, onUpdate, onAddBlock, onRemoveBlock }) {
  const addRef = useRef()
  const [open, setOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const members = grp.members || []
  const blocked = grp.cmdBlocked || []
  const warned  = (grp.memberWarnCount || []).filter(w => w.count > 0).length
  const enabled = TOGGLES.filter(t => t.field !== 'isBotOn' && grp[t.field])

  return (
    <div className={cx('bg-s1 border rounded-[14px] overflow-hidden transition-colors', open ? 'border-accent/30' : 'border-line hover:border-accent/30')}>
      <div
        className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,2.2fr)_auto_auto_auto_auto] items-center gap-x-4 gap-y-2.5 md:gap-x-[18px] px-4 py-3.5 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <div className="min-w-0">
          <h3 className="text-[0.9rem] font-semibold truncate">{grp.grpName || 'Unnamed Group'}</h3>
          <Jid className="block mt-0.5">{grp._id}</Jid>
          {enabled.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {enabled.map(t => (
                <span key={t.field} className="px-[7px] py-0.5 rounded-full bg-success/10 text-success text-[0.62rem] whitespace-nowrap">{t.label}</span>
              ))}
            </div>
          )}
        </div>

        <Badge tone={grp.isBotOn ? 'on' : 'off'} className="justify-self-end md:justify-self-auto">{grp.isBotOn ? 'Active' : 'Off'}</Badge>

        <div className="flex gap-[18px] col-span-2 md:contents">
          <div className="md:text-right md:min-w-16">
            <strong className="block text-[0.95rem] font-semibold">{fmt(members.length)}</strong>
            <span className="text-[0.64rem] text-muted uppercase tracking-wider">Members</span>
          </div>
          <div className="md:text-right md:min-w-16">
            <strong className="block text-[0.95rem] font-semibold">{fmt(grp.totalMsgCount)}</strong>
            <span className="text-[0.64rem] text-muted uppercase tracking-wider">Messages</span>
          </div>
        </div>

        <span className={cx('hidden md:block text-[0.8rem] text-muted transition-transform', open && 'rotate-180')}>▼</span>
      </div>

      {open && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[18px] p-4 border-t border-line">
          {grp.desc && <p className="col-span-full text-[0.77rem] text-soft leading-relaxed">{grp.desc}</p>}

          <Section label="Activity" className="col-span-full">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2">
              {TYPE_TOTALS.map(([label, key]) => <MiniStat key={key} value={fmt(sum(members, key))} label={label} />)}
              <MiniStat value={fmt(warned)} label="Warned members" />
              <MiniStat value={fmt(blocked.length)} label="Blocked cmds" />
            </div>
          </Section>

          <Section label="Features">
            <div className="flex flex-col gap-[5px]">
              {TOGGLES.map(({ field, label }) => (
                <div key={field} className="flex items-center justify-between bg-s2 rounded-md px-2.5 py-[7px] text-[0.76rem] text-soft">
                  <span>{label}</span>
                  <Toggle checked={!!grp[field]} onChange={e => onUpdate(grp._id, field, e.target.checked)} />
                </div>
              ))}
            </div>
          </Section>

          <Section label={`Blocked Commands (${blocked.length})`}>
            <div className="flex flex-wrap items-center gap-[5px]">
              {blocked.map(cmd => (
                <span key={cmd} className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md border border-line bg-s2 text-soft font-mono text-[0.71rem]">
                  {cmd}
                  <button className="text-danger/60 hover:text-danger text-[0.68rem] transition-colors" onClick={() => onRemoveBlock(grp._id, cmd)} title="Unblock">✕</button>
                </span>
              ))}
              {!blocked.length && <span className="text-xs text-muted">None</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                ref={addRef}
                type="text"
                placeholder="add command…"
                className="w-36 px-2.5 py-1 bg-s2 border border-line rounded-md text-ink text-[0.76rem] font-mono outline-none focus:border-accent/50 placeholder:text-muted"
              />
              <Btn variant="sm" onClick={() => {
                const v = addRef.current?.value?.trim().toLowerCase()
                if (v) { onAddBlock(grp._id, v); addRef.current.value = '' }
              }}>Add</Btn>
            </div>
          </Section>

          <TextField label="Group Rules (shown by -rules)" value={grp.rules} placeholder="No rules set" onSave={v => onUpdate(grp._id, 'rules', v)} />
          <TextField label="Welcome Message" value={grp.welcome} placeholder="No welcome message" onSave={v => onUpdate(grp._id, 'welcome', v)} />

          <div className="col-span-full">
            <Btn variant="sm" onClick={() => setShowHistory(true)}>📋 Chat History</Btn>
          </div>
        </div>
      )}

      {showHistory && <ChatHistoryModal grp={grp} onClose={() => setShowHistory(false)} />}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────────── */
export default function Groups() {
  const toast = useToast()
  const [groups,  setGroups]  = useState([])
  const [loading, setLoading] = useState(true)
  const [sort,    setSort]    = useState('active')
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    getGroups()
      .then(setGroups)
      .catch(() => toast('Failed to load groups', false))
      .finally(() => setLoading(false))
  }, [])

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    let list = groups.filter(g =>
      (!q || (g.grpName || '').toLowerCase().includes(q) || g._id.includes(q)) &&
      (filter === 'all' || (filter === 'active') === !!g.isBotOn)
    )
    const by = {
      'active':    (a, b) => (b.isBotOn ? 1 : 0) - (a.isBotOn ? 1 : 0),
      'name-asc':  (a, b) => (a.grpName || '').localeCompare(b.grpName || ''),
      'name-desc': (a, b) => (b.grpName || '').localeCompare(a.grpName || ''),
      'msg-desc':  (a, b) => (b.totalMsgCount || 0) - (a.totalMsgCount || 0),
      'msg-asc':   (a, b) => (a.totalMsgCount || 0) - (b.totalMsgCount || 0),
    }[sort]
    return by ? [...list].sort(by) : list
  }, [groups, sort, search, filter])

  const patch = (jid, changes) => setGroups(prev => prev.map(g => g._id === jid ? { ...g, ...changes } : g))

  async function handleUpdate(jid, field, val) {
    const old = groups.find(g => g._id === jid)?.[field]
    patch(jid, { [field]: val })
    try {
      await updateGroup(jid, { [field]: val })
      toast(typeof val === 'boolean' ? `${field} → ${val}` : `${field} saved`)
    } catch (err) {
      patch(jid, { [field]: old })
      toast(err.message, false)
    }
  }

  async function setBlocked(jid, next, okMsg) {
    const old = groups.find(g => g._id === jid)?.cmdBlocked
    patch(jid, { cmdBlocked: next })
    try {
      await updateGroup(jid, { cmdBlocked: next })
      toast(okMsg)
    } catch (err) {
      patch(jid, { cmdBlocked: old })
      toast(err.message, false)
    }
  }

  const handleAddBlock = (jid, cmd) => {
    const cur = groups.find(g => g._id === jid)?.cmdBlocked || []
    return setBlocked(jid, [...new Set([...cur, cmd])], `Blocked: ${cmd}`)
  }
  const handleRemoveBlock = (jid, cmd) => {
    const cur = groups.find(g => g._id === jid)?.cmdBlocked || []
    return setBlocked(jid, cur.filter(c => c !== cmd), `Unblocked: ${cmd}`)
  }

  const activeCount   = groups.filter(g => g.isBotOn).length
  const totalMembers  = groups.reduce((n, g) => n + (g.members || []).length, 0)
  const totalMessages = groups.reduce((n, g) => n + (g.totalMsgCount || 0), 0)

  return (
    <div>
      <PageHeader
        title="Groups"
        sub={<>{groups.length} total · <span className="text-success">{activeCount} active</span></>}
      >
        <SearchInput placeholder="Search groups…" value={search} onChange={e => setSearch(e.target.value)} />
      </PageHeader>

      <StatGrid className="mb-4">
        <StatCard label="Groups"   value={fmt(groups.length)} />
        <StatCard label="Active"   value={fmt(activeCount)} color="text-success" />
        <StatCard label="Inactive" value={fmt(groups.length - activeCount)} />
        <StatCard label="Members"  value={fmt(totalMembers)} />
        <StatCard label="Messages" value={fmt(totalMessages)} />
      </StatGrid>

      <Chips>
        {FILTERS.map(f => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</Chip>
        ))}
        <span className="w-px bg-line mx-1" />
        {SORTS.map(s => (
          <Chip key={s.key} active={sort === s.key} onClick={() => setSort(s.key)}>{s.label}</Chip>
        ))}
      </Chips>

      {loading ? (
        <Loading />
      ) : rows.length ? (
        <div className="flex flex-col gap-2.5">
          {rows.map(g => (
            <GroupRow
              key={g._id}
              grp={g}
              onUpdate={handleUpdate}
              onAddBlock={handleAddBlock}
              onRemoveBlock={handleRemoveBlock}
            />
          ))}
        </div>
      ) : (
        <Empty>No groups found.</Empty>
      )}
    </div>
  )
}
