import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { sendDirect, getMembers } from '../lib/api.js'
import { useToast } from '../App.jsx'

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
      <div className="page-header">
        <div>
          <h2>Direct Message</h2>
          <p className="sub">Send a message directly to any user by JID.</p>
        </div>
      </div>

      <div className="dm-wrap">
        <div className="card dm-compose">
          <div className="form-field">
            <label className="form-label">Search Members</label>
            <input
              className="form-input"
              placeholder="Type name or number to search…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            {members.length > 0 && (
              <div className="dm-suggestions">
                {members.map(m => (
                  <button
                    key={m._id}
                    className="dm-suggestion"
                    onClick={() => { setJid(m._id); setMembers([]); setSearch('') }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.username || '—'}</span>
                    <code className="jid-sm">{m._id}</code>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-field" style={{ marginTop: 14 }}>
            <label className="form-label">Recipient JID</label>
            <input
              className="form-input"
              placeholder="e.g. 919876543210@s.whatsapp.net"
              value={jid}
              onChange={e => setJid(e.target.value)}
            />
          </div>

          <div className="form-field" style={{ marginTop: 14 }}>
            <label className="form-label">
              Message&nbsp;
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                Ctrl+Enter to send
              </span>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Type your message…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={6}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={sending || !jid.trim() || !message.trim()}
            style={{ marginTop: 16, width: '100%' }}
          >
            {sending ? 'Sending…' : 'Send Message'}
          </button>
        </div>

        {history.length > 0 && (
          <div className="card dm-history">
            <p className="chart-title" style={{ marginBottom: 14 }}>Sent This Session</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map((h, i) => (
                <div key={i} className="dm-history-row">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <code className="jid-sm">{h.jid}</code>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
                      {fmtTime(h.ts)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-soft)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {h.msg}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
