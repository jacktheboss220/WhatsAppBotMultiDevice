import { useEffect, useState, useRef } from 'react'
import { getHealth, fmtUptime, fmtBytes, requestPair, clearAuth, logoutBot, reconnectBot, restartBot } from '../lib/api.js'
import { useToast } from '../App.jsx'
import { Btn, Card, ErrorBox, ErrorState, Input, Loading, PageHeader, ProgressBar, SectionLabel, Spinner, cx } from '../components/ui.jsx'

const toneFor = pct => (pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : null)
const TEXT = { danger: 'text-danger', warning: 'text-warning' }
const FILL = { danger: 'bg-danger', warning: 'bg-warning' }

function HealthCard({ label, value, sub, pct }) {
  const tone = pct === undefined ? null : toneFor(pct)
  return (
    <div className="bg-s1 border border-line rounded-[14px] p-[18px]">
      <p className="text-[0.7rem] text-muted uppercase tracking-wider font-semibold mb-1.5">{label}</p>
      <p className={cx('text-2xl font-bold leading-none', tone && TEXT[tone])}>{value}</p>
      {sub && <p className="text-[0.73rem] text-muted mt-1">{sub}</p>}
      {pct !== undefined && <ProgressBar pct={pct} tone={tone ? FILL[tone] : 'bg-accent'} className="mt-2.5" />}
    </div>
  )
}

const HealthGrid = ({ children, className }) => (
  <div className={cx('grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3', className)}>{children}</div>
)

const Divider = () => <div className="h-px bg-line" />

function ActionRow({ title, children, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-[0.88rem] font-semibold mb-1">{title}</p>
        {children}
      </div>
      {action}
    </div>
  )
}

const Hint = ({ children }) => <p className="text-[0.76rem] text-muted leading-relaxed">{children}</p>

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
    <ActionRow
      title={label}
      action={
        <div className="flex flex-col gap-1.5 shrink-0">
          <Btn variant="danger" onClick={handle} disabled={loading || disabled} className="min-w-[148px]">
            {loading
              ? <><Spinner size="size-3.5" />{loadingLabel || 'Working…'}</>
              : confirm ? `⚠️ ${confirmLabel || 'Confirm'}` : label}
          </Btn>
          {confirm && <Btn variant="ghost" onClick={() => setConfirm(false)} className="text-xs">Cancel</Btn>}
        </div>
      }
    >
      <Hint>{description}</Hint>
      {confirm && <p className="text-[0.73rem] text-warning mt-1.5">⚠️ {warning || 'Click again to confirm.'}</p>}
    </ActionRow>
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

  if (loading) return <Loading />
  if (error)   return <ErrorState>{error}</ErrorState>
  if (!data)   return null

  const { memory, uptime, connected, nodeVersion, pid, platform } = data
  // Bun can report heapTotal < heapUsed, so clamp to keep the ratio sane
  const heapPct = Math.min(100, Math.round((memory.heapUsed / memory.heapTotal) * 100))
  const heapTone = toneFor(heapPct)

  return (
    <div>
      <PageHeader title="Bot Health" sub="Process stats · auto-refreshes every 10 s">
        <span className={cx('flex items-center gap-[7px] text-[0.82rem]', connected ? 'text-success' : 'text-danger')}>
          <span className={cx('size-1.5 rounded-full', connected ? 'bg-success animate-glow' : 'bg-danger')} />
          {connected ? 'WhatsApp Connected' : 'WhatsApp Disconnected'}
        </span>
      </PageHeader>

      {/* ── Memory ──────────────────────────────────────────────────────────── */}
      <SectionLabel className="mt-0">Memory</SectionLabel>
      <HealthGrid className="mb-3.5">
        <HealthCard label="Heap Used"  value={fmtBytes(memory.heapUsed)}  pct={heapPct} />
        <HealthCard label="Heap Total" value={fmtBytes(memory.heapTotal)} />
        <HealthCard label="RSS"        value={fmtBytes(memory.rss)}        sub="Resident set size" />
        <HealthCard label="External"   value={fmtBytes(memory.external)} />
      </HealthGrid>
      <Card className="mb-1">
        <div className="flex justify-between mb-2.5">
          <span className="text-[0.82rem] font-semibold">Heap Utilization</span>
          <span className={cx('text-[0.82rem]', heapTone ? TEXT[heapTone] : 'text-success')}>{heapPct}%</span>
        </div>
        <ProgressBar pct={heapPct} tone={heapTone ? FILL[heapTone] : 'bg-accent'} className="h-2" />
        <div className="flex justify-between mt-1.5 text-[0.7rem] text-muted">
          <span>{fmtBytes(memory.heapUsed)} used</span>
          <span>{fmtBytes(memory.heapTotal)} total</span>
        </div>
      </Card>

      {/* ── Process ─────────────────────────────────────────────────────────── */}
      <SectionLabel>Process</SectionLabel>
      <HealthGrid className="mb-1">
        <HealthCard label="Uptime"   value={fmtUptime(uptime + tick)} sub="Since last restart" />
        <HealthCard label="PID"      value={pid} />
        <HealthCard label="Node.js"  value={nodeVersion} />
        <HealthCard label="Platform" value={platform} />
      </HealthGrid>

      {/* ── Connection Management ───────────────────────────────────────────── */}
      <SectionLabel>Connection Management</SectionLabel>
      <Card className="flex flex-col gap-5">

        {/* 1. Reconnect */}
        <ActionRow
          title="🔄 Reconnect Bot"
          action={
            <Btn onClick={handleReconnect} disabled={reconnecting} className="shrink-0 min-w-[148px]">
              {reconnecting ? <><Spinner size="size-3.5" />Reconnecting…</> : '🔄 Reconnect'}
            </Btn>
          }
        >
          <Hint>
            Creates a fresh WhatsApp socket <strong className="text-soft">without restarting the process</strong>. Use this after Logout or Clear Auth — the bot will generate a new QR code on the main page.
          </Hint>
          {reconnecting && (
            <p className="flex items-center gap-1.5 text-[0.73rem] text-accent mt-2">
              <Spinner size="size-3" />
              Reconnecting… visit the <a href="/" target="_blank" className="underline">bot page</a> to scan the new QR code.
            </p>
          )}
        </ActionRow>

        <Divider />

        {/* 2. Pairing code */}
        <div>
          <p className="text-[0.88rem] font-semibold mb-1">📱 Login with Phone Number</p>
          <Hint>After reconnecting (no credentials), use this to get a pairing code instead of scanning QR.</Hint>
          <div className="flex flex-wrap gap-2 mt-2.5">
            <Input
              type="tel"
              placeholder="e.g. 919876543210"
              value={phone}
              onChange={e => { setPhone(e.target.value); setPairErr(''); setPairCode('') }}
              className="font-mono max-w-[220px]"
            />
            <Btn onClick={handlePair} disabled={pairLoading || !phone.trim()}>
              {pairLoading ? <><Spinner size="size-3.5" />Requesting…</> : 'Get Pairing Code'}
            </Btn>
          </div>
          {pairErr && <ErrorBox className="mt-2.5">{pairErr}</ErrorBox>}
          {pairCode && (
            <div className="flex flex-wrap items-center justify-between gap-3 mt-2.5 px-[18px] py-3.5 bg-accent/10 border border-accent/30 rounded-[10px]">
              <div>
                <p className="text-[0.67rem] text-accent font-bold uppercase tracking-widest mb-1">Pairing Code</p>
                <p className="text-[1.9rem] font-extrabold tracking-[0.2em] font-mono leading-none">{pairCode}</p>
                <p className="text-[0.7rem] text-muted mt-1.5">WhatsApp → Linked Devices → Link a Device → Link with phone number</p>
              </div>
              <Btn variant="ghost" onClick={() => { navigator.clipboard.writeText(pairCode); toast('Copied!') }}>Copy</Btn>
            </div>
          )}
        </div>

        <Divider />

        {/* 3. Logout bot */}
        <DangerAction
          label="Logout Bot"
          confirmLabel="Confirm Logout"
          loadingLabel="Logging out…"
          description="Sends a proper logout signal to WhatsApp. The socket becomes unusable — click Reconnect afterwards to create a new one and get a fresh QR."
          warning="This disconnects the bot from WhatsApp immediately."
          disabled={!connected}
          onConfirm={handleLogout}
        />

        <Divider />

        {/* 4. Clear auth */}
        <DangerAction
          label="Clear Auth Database"
          confirmLabel="Confirm Clear"
          loadingLabel="Clearing…"
          description="Deletes all session credentials from MongoDB. Use when the bot is stuck and won't reconnect. After clearing, click Reconnect to start fresh."
          warning="This permanently deletes session data from the database."
          onConfirm={handleClearAuth}
        />

        <Divider />

        {/* 5. Restart process */}
        <ActionRow
          title="⚡ Restart Process"
          action={<Btn variant="danger" onClick={handleRestart} className="shrink-0 min-w-[148px]">⚡ Restart Process</Btn>}
        >
          <Hint>
            Spawns a fresh Node.js process and exits the current one. Use as a last resort — prefer <strong className="text-soft">Reconnect</strong> for socket issues. The page will reload automatically when the server is back.
          </Hint>
        </ActionRow>
      </Card>
    </div>
  )
}
