import { useEffect, useState, useRef } from 'react'
import { getHealth, fmtUptime, fmtBytes, requestPair, clearAuth, logoutBot, reconnectBot, restartBot } from '../lib/api.js'
import { useToast } from '../App.jsx'

/* ── tiny helpers ──────────────────────────────────────────────────────────── */
function Sec({ children }) {
  return (
    <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: 22 }}>
      {children}
    </p>
  )
}

function HealthCard({ label, value, sub, pct }) {
  const color   = pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : 'var(--text)'
  const fillCls = pct >= 90 ? 'crit' : pct >= 70 ? 'warn' : ''
  return (
    <div className="health-card">
      <p className="health-card-label">{label}</p>
      <p className="health-card-value" style={pct !== undefined ? { color } : {}}>{value}</p>
      {sub && <p className="health-card-sub">{sub}</p>}
      {pct !== undefined && (
        <div className="progress-bar">
          <div className={`progress-fill ${fillCls}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      )}
    </div>
  )
}

/* ── confirm-button pattern ────────────────────────────────────────────────── */
function DangerAction({ label, confirmLabel, description, warning, loadingLabel, onConfirm, disabled }) {
  const [confirm,  setConfirm]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const timer = useRef(null)

  // auto-cancel confirm after 8 s
  useEffect(() => {
    if (confirm) {
      timer.current = setTimeout(() => setConfirm(false), 8000)
    }
    return () => clearTimeout(timer.current)
  }, [confirm])

  async function handle() {
    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
      setConfirm(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{description}</p>
        {confirm && (
          <p style={{ fontSize: '0.73rem', color: 'var(--warning)', marginTop: 6 }}>
            ⚠️ {warning || 'Click again to confirm.'}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button
          className="btn btn-danger-ghost"
          onClick={handle}
          disabled={loading || disabled}
          style={{ minWidth: 148 }}
        >
          {loading
            ? <><span className="spinner" style={{ width: 14, height: 14 }} />{loadingLabel || 'Working…'}</>
            : confirm ? `⚠️ ${confirmLabel || 'Confirm'}` : label}
        </button>
        {confirm && (
          <button className="btn btn-ghost" onClick={() => setConfirm(false)} style={{ fontSize: '0.75rem' }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   Health page
══════════════════════════════════════════════════════════════════════════════ */
export default function Health() {
  const toast = useToast()

  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [tick,        setTick]        = useState(0)

  // Pairing code
  const [phone,       setPhone]       = useState('')
  const [pairLoading, setPairLoading] = useState(false)
  const [pairCode,    setPairCode]    = useState('')
  const [pairErr,     setPairErr]     = useState('')

  // Reconnect state — show a live "waiting for QR" hint while reconnecting
  const [reconnecting, setReconnecting] = useState(false)

  function load() {
    getHealth()
      .then(d => { setData(d); setError('') })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(); const t = setInterval(load, 10_000); return () => clearInterval(t) }, [])
  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 1000); return () => clearInterval(t) }, [])

  /* ── actions ─────────────────────────────────────────────────────────────── */

  async function handleReconnect() {
    setReconnecting(true)
    try {
      await reconnectBot()
      toast('Reconnecting… a new QR code is on its way to the bot page.')
      // Give the socket 15 s to boot, then refresh health
      setTimeout(() => { load(); setReconnecting(false) }, 15_000)
    } catch (err) {
      toast(err.message, false)
      setReconnecting(false)
    }
  }

  async function handleRestart() {
    toast('Process restarting — page will be unavailable for a few seconds.')
    try { await restartBot() } catch (_) {}
    // Poll until the server comes back
    const interval = setInterval(async () => {
      try {
        const r = await fetch('/api/status')
        if (r.ok) { clearInterval(interval); window.location.reload() }
      } catch (_) {}
    }, 1500)
  }

  async function handleLogout() {
    try {
      await logoutBot()
      toast('Bot logged out of WhatsApp.')
      load()
    } catch (err) { toast(err.message, false) }
  }

  async function handleClearAuth() {
    try {
      const r = await clearAuth()
      toast(`Auth cleared (${r.deleted} records removed). Now click Reconnect to get a new QR.`)
    } catch (err) { toast(err.message, false) }
  }

  async function handlePair() {
    if (!phone.trim()) return setPairErr('Enter your phone number with country code.')
    setPairErr(''); setPairCode(''); setPairLoading(true)
    try {
      const r = await requestPair(phone.trim())
      setPairCode(r.code)
      toast('Pairing code ready!')
    } catch (err) { setPairErr(err.message) }
    finally { setPairLoading(false) }
  }

  if (loading) return <div className="loading-state"><span className="spinner" /></div>
  if (error)   return <p className="error-state">{error}</p>
  if (!data)   return null

  const { memory, uptime, connected, nodeVersion, pid, platform } = data
  const heapPct = Math.round((memory.heapUsed / memory.heapTotal) * 100)

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Bot Health</h2>
          <p className="sub">Process stats · auto-refreshes every 10 s</p>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', color: connected ? 'var(--success)' : 'var(--danger)' }}>
          <span className={`conn-dot ${connected ? 'on' : ''}`} />
          {connected ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
        </span>
      </div>

      {/* ── Memory ──────────────────────────────────────────────────────────── */}
      <Sec>Memory</Sec>
      <div className="health-grid" style={{ marginBottom: 14 }}>
        <HealthCard label="Heap Used"  value={fmtBytes(memory.heapUsed)}  sub={`${heapPct}% of ${fmtBytes(memory.heapTotal)}`} pct={heapPct} />
        <HealthCard label="Heap Total" value={fmtBytes(memory.heapTotal)} />
        <HealthCard label="RSS"        value={fmtBytes(memory.rss)}        sub="Resident set size" />
        <HealthCard label="External"   value={fmtBytes(memory.external)} />
      </div>
      <div className="card" style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Heap Utilization</span>
          <span style={{ fontSize: '0.82rem', color: heapPct >= 90 ? 'var(--danger)' : heapPct >= 70 ? 'var(--warning)' : 'var(--success)' }}>{heapPct}%</span>
        </div>
        <div className="progress-bar" style={{ height: 8 }}>
          <div className={`progress-fill ${heapPct >= 90 ? 'crit' : heapPct >= 70 ? 'warn' : ''}`} style={{ width: `${heapPct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>{fmtBytes(memory.heapUsed)} used</span>
          <span>{fmtBytes(memory.heapTotal)} total</span>
        </div>
      </div>

      {/* ── Process ─────────────────────────────────────────────────────────── */}
      <Sec>Process</Sec>
      <div className="health-grid" style={{ marginBottom: 4 }}>
        <HealthCard label="Uptime"   value={fmtUptime(uptime + tick)} sub="Since last restart" />
        <HealthCard label="PID"      value={pid} />
        <HealthCard label="Node.js"  value={nodeVersion} />
        <HealthCard label="Platform" value={platform} />
      </div>

      {/* ══ Connection Management ════════════════════════════════════════════ */}
      <Sec>Connection Management</Sec>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── 1. RECONNECT — primary action ─────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
                🔄 Reconnect Bot
              </p>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Creates a fresh WhatsApp socket <strong style={{ color: 'var(--text-soft)' }}>without restarting the process</strong>. Use this after Logout or Clear Auth — the bot will generate a new QR code on the main page.
              </p>
              {reconnecting && (
                <p style={{ fontSize: '0.73rem', color: 'var(--accent)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="spinner" style={{ width: 12, height: 12 }} />
                  Reconnecting… visit the <a href="/" target="_blank" style={{ color: 'var(--accent)' }}>bot page</a> to scan the new QR code.
                </p>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleReconnect}
              disabled={reconnecting}
              style={{ flexShrink: 0, minWidth: 148 }}
            >
              {reconnecting
                ? <><span className="spinner" style={{ width: 14, height: 14 }} />Reconnecting…</>
                : '🔄 Reconnect'}
            </button>
          </div>
        </div>

        <div className="divider" style={{ margin: 0 }} />

        {/* ── 2. Pairing code ───────────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>📱 Login with Phone Number</p>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
            After reconnecting (no credentials), use this to get a pairing code instead of scanning QR.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              className="form-input"
              type="tel"
              placeholder="e.g. 919876543210"
              value={phone}
              onChange={e => { setPhone(e.target.value); setPairErr(''); setPairCode('') }}
              style={{ fontFamily: 'monospace', maxWidth: 220 }}
            />
            <button
              className="btn btn-primary"
              onClick={handlePair}
              disabled={pairLoading || !phone.trim()}
            >
              {pairLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} />Requesting…</> : 'Get Pairing Code'}
            </button>
          </div>
          {pairErr && <div className="error-box" style={{ marginTop: 10 }}>{pairErr}</div>}
          {pairCode && (
            <div style={{ marginTop: 10, padding: '14px 18px', background: 'var(--accent-dim)', border: '1px solid var(--accent-bdr)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '0.67rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Pairing Code</p>
                <p style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '0.2em', fontFamily: 'monospace', lineHeight: 1 }}>{pairCode}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 5 }}>WhatsApp → Linked Devices → Link a Device → Link with phone number</p>
              </div>
              <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(pairCode); toast('Copied!') }}>Copy</button>
            </div>
          )}
        </div>

        <div className="divider" style={{ margin: 0 }} />

        {/* ── 3. Logout bot ─────────────────────────────────────────────────── */}
        <DangerAction
          label="Logout Bot"
          confirmLabel="Confirm Logout"
          loadingLabel="Logging out…"
          description="Sends a proper logout signal to WhatsApp. The socket becomes unusable — click Reconnect afterwards to create a new one and get a fresh QR."
          warning="This disconnects the bot from WhatsApp immediately."
          disabled={!connected}
          onConfirm={handleLogout}
        />

        <div className="divider" style={{ margin: 0 }} />

        {/* ── 4. Clear auth ─────────────────────────────────────────────────── */}
        <DangerAction
          label="Clear Auth Database"
          confirmLabel="Confirm Clear"
          loadingLabel="Clearing…"
          description="Deletes all session credentials from MongoDB. Use when the bot is stuck and won't reconnect. After clearing, click Reconnect to start fresh."
          warning="This permanently deletes session data from the database."
          onConfirm={handleClearAuth}
        />

        <div className="divider" style={{ margin: 0 }} />

        {/* ── 5. Restart process ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>⚡ Restart Process</p>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Spawns a fresh Node.js process and exits the current one. Use as a last resort — prefer <strong style={{ color: 'var(--text-soft)' }}>Reconnect</strong> for socket issues. The page will reload automatically when the server is back.
            </p>
          </div>
          <button
            className="btn btn-danger-ghost"
            onClick={handleRestart}
            style={{ flexShrink: 0, minWidth: 148 }}
          >
            ⚡ Restart Process
          </button>
        </div>

      </div>
    </div>
  )
}
