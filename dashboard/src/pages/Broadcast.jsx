import { useEffect, useState, useMemo } from 'react'
import { getGroups, broadcast } from '../lib/api.js'
import { useToast } from '../App.jsx'
import { Btn, Card, CardTitle, PageHeader, SearchInput, Spinner, Textarea, cx } from '../components/ui.jsx'

const MODES = (active, all) => [
  { key: 'active', label: `Active groups (${active})`, sub: 'Only groups where bot is ON' },
  { key: 'all',    label: `All groups (${all})`,       sub: 'Every group in the database' },
  { key: 'custom', label: 'Custom selection',          sub: 'Pick specific groups below' },
]

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
      <PageHeader title="Broadcast" sub="Send a message to multiple groups at once." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
        {/* Left: Message */}
        <div className="flex flex-col gap-3.5">
          <Card>
            <CardTitle
              sub="This text will be sent as-is to all selected groups."
              right={<span className="text-xs text-muted">{message.length} / 4096</span>}
            >
              Message
            </CardTitle>
            <Textarea
              placeholder="Type your broadcast message here…"
              value={message}
              maxLength={4096}
              onChange={e => setMessage(e.target.value)}
              className="min-h-40"
            />
          </Card>

          {message.trim() && (
            <Card>
              <p className="text-[0.9rem] font-semibold mb-2.5">Preview</p>
              <div className="bg-s2 rounded-[10px] px-3.5 py-3 text-[0.85rem] text-soft whitespace-pre-wrap break-words border-l-[3px] border-accent">
                {message}
              </div>
            </Card>
          )}

          <Btn
            onClick={handleSend}
            disabled={loading || !message.trim() || targetCount() === 0}
            className="self-start px-6"
          >
            {loading
              ? <><Spinner size="size-3.5" /> Sending…</>
              : `📢 Send to ${targetCount()} group${targetCount() !== 1 ? 's' : ''}`
            }
          </Btn>

          {result && !result.error && (
            <div className={cx('px-[18px] py-3.5 bg-s2 border rounded-[10px] text-[0.84rem]', result.failed > 0 ? 'border-line' : 'border-success/30')}>
              <strong>✅ Sent to {result.sent}</strong> / {result.total} groups
              {result.failed > 0 && <span className="text-warning ml-2">· {result.failed} failed</span>}
            </div>
          )}
          {result?.error && (
            <div className="px-[18px] py-3.5 bg-s2 border border-danger/30 text-danger rounded-[10px] text-[0.84rem]">❌ {result.error}</div>
          )}
        </div>

        {/* Right: Target selection */}
        <Card className="lg:sticky lg:top-0">
          <p className="text-[0.9rem] font-semibold mb-3">Target Groups</p>

          <div className="flex flex-col gap-1.5 mb-3.5">
            {MODES(activeGroups.length, groups.length).map(({ key, label, sub }) => (
              <label
                key={key}
                className={cx(
                  'flex gap-2.5 px-3 py-2.5 rounded-md border cursor-pointer transition',
                  mode === key ? 'bg-accent/10 border-accent/30' : 'bg-s2 border-line'
                )}
              >
                <input
                  type="radio"
                  name="mode"
                  value={key}
                  checked={mode === key}
                  onChange={() => { setMode(key); setSelected(new Set()) }}
                  className="accent-accent mt-0.5 shrink-0"
                />
                <div>
                  <div className="text-[0.82rem] font-semibold">{label}</div>
                  <div className="text-[0.72rem] text-muted mt-0.5">{sub}</div>
                </div>
              </label>
            ))}
          </div>

          {mode === 'custom' && (
            <>
              <SearchInput
                className="w-full rounded-md mb-2"
                placeholder="Search groups…"
                value={grpSearch}
                onChange={e => setGrpSearch(e.target.value)}
              />
              <div className="max-h-[260px] overflow-y-auto border border-line rounded-[10px] bg-s2">
                {filteredGroups.map(g => (
                  <div
                    key={g._id}
                    className="flex items-center gap-2.5 px-3.5 py-[9px] border-b border-line last:border-b-0 cursor-pointer text-[0.83rem] hover:bg-s3 transition-colors"
                    onClick={() => toggleSelect(g._id)}
                  >
                    <input
                      type="checkbox"
                      className="size-[15px] accent-accent cursor-pointer"
                      checked={selected.has(g._id)}
                      onChange={() => toggleSelect(g._id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <div className="min-w-0">
                      <div className="text-[0.81rem] font-medium truncate">{g.grpName || 'Unnamed Group'}</div>
                      <div className="text-[0.66rem] text-muted">
                        {g.isBotOn ? '✅ Active' : '⭕ Inactive'} · {g.totalMsgCount || 0} msgs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selected.size > 0 && (
                <p className="text-xs text-muted mt-2">
                  {selected.size} group{selected.size !== 1 ? 's' : ''} selected
                </p>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
