import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { sendDirect, getMembers } from '../lib/api.js'
import { useToast } from '../App.jsx'
import { Btn, Card, ChartTitle, Field, Input, Jid, PageHeader, Textarea } from '../components/ui.jsx'

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false })
}

export default function DirectMessage() {
  const toast    = useToast()
  const location = useLocation()
  const [jid,      setJid]      = useState('')
  const [message,  setMessage]  = useState('')
  const [sending,  setSending]  = useState(false)
  const [history,  setHistory]  = useState([])
  const [search,   setSearch]   = useState('')
  const [members,  setMembers]  = useState([])
  const debounce = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const j = params.get('jid')
    if (j) setJid(j)
  }, [location.search])

  function handleSearch(val) {
    setSearch(val)
    clearTimeout(debounce.current)
    if (!val.trim()) { setMembers([]); return }
    debounce.current = setTimeout(() => {
      getMembers({ search: val, limit: 8, page: 1 })
        .then(d => setMembers(d.members || []))
        .catch(() => {})
    }, 300)
  }

  async function handleSend() {
    if (!jid.trim() || !message.trim()) return
    setSending(true)
    try {
      await sendDirect(jid.trim(), message.trim())
      setHistory(prev => [{ jid: jid.trim(), msg: message.trim(), ts: Date.now() }, ...prev.slice(0, 9)])
      setMessage('')
      toast('Message sent!')
    } catch (err) {
      toast(err.message, false)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSend()
  }

  return (
    <div>
      <PageHeader title="Direct Message" sub="Send a message directly to any user by JID." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card className="flex flex-col gap-3.5">
          <Field label="Search Members">
            <Input
              placeholder="Type name or number to search…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            {members.length > 0 && (
              <div className="flex flex-col bg-s2 border border-line rounded-[10px] mt-1.5 overflow-hidden">
                {members.map(m => (
                  <button
                    key={m._id}
                    className="flex flex-col gap-[3px] px-3.5 py-[9px] text-left border-b border-line last:border-b-0 hover:bg-s3 transition-colors"
                    onClick={() => { setJid(m._id); setMembers([]); setSearch('') }}
                  >
                    <span className="font-semibold text-[0.85rem]">{m.username || '—'}</span>
                    <Jid>{m._id}</Jid>
                  </button>
                ))}
              </div>
            )}
          </Field>

          <Field label="Recipient JID">
            <Input
              placeholder="e.g. 919876543210@s.whatsapp.net"
              value={jid}
              onChange={e => setJid(e.target.value)}
            />
          </Field>

          <Field label="Message" hint="Ctrl+Enter to send">
            <Textarea
              placeholder="Type your message…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={6}
            />
          </Field>

          <Btn onClick={handleSend} disabled={sending || !jid.trim() || !message.trim()} className="w-full mt-1">
            {sending ? 'Sending…' : 'Send Message'}
          </Btn>
        </Card>

        {history.length > 0 && (
          <Card>
            <ChartTitle>Sent This Session</ChartTitle>
            <div className="flex flex-col gap-2.5">
              {history.map((h, i) => (
                <div key={i} className="bg-s2 border border-line rounded-md px-3.5 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <Jid>{h.jid}</Jid>
                    <span className="text-[0.7rem] text-muted shrink-0 ml-2">{fmtTime(h.ts)}</span>
                  </div>
                  <p className="text-[0.83rem] text-soft whitespace-pre-wrap break-words">{h.msg}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
