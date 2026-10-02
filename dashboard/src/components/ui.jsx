// Shared Tailwind building blocks. Pages compose these instead of repeating long class strings.

export const cx = (...c) => c.filter(Boolean).join(' ')

/* ── Layout ─────────────────────────────────────────────────────────────────── */
export function PageHeader({ title, sub, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h2 className="text-xl 2xl:text-2xl font-bold">{title}</h2>
        {sub && <p className="text-muted text-[0.8rem] mt-0.5">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export function Card({ className, children, ...p }) {
  return <div className={cx('bg-s1 border border-line rounded-[14px] p-5', className)} {...p}>{children}</div>
}

export function CardTitle({ children, sub, right }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <div>
        <p className="text-[0.9rem] font-semibold">{children}</p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function ChartTitle({ children }) {
  return <p className="text-[0.85rem] font-semibold text-soft mb-4">{children}</p>
}

export function SectionLabel({ children, className }) {
  return <p className={cx('text-[0.68rem] font-bold text-muted uppercase tracking-widest mb-2.5 mt-5', className)}>{children}</p>
}

export function StatGrid({ children, className }) {
  return <div className={cx('grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 mb-6', className)}>{children}</div>
}

export function StatCard({ icon, value, label, color = 'text-ink' }) {
  return (
    <div className="flex items-center gap-3.5 bg-s1 border border-line hover:border-line-hi rounded-[14px] px-[18px] py-4 transition-colors">
      {icon && <span className="text-2xl shrink-0">{icon}</span>}
      <div className="min-w-0">
        <strong className={cx('block text-[1.4rem] font-bold leading-none', color)}>{value ?? '—'}</strong>
        <span className="block text-[0.7rem] text-muted uppercase tracking-wider mt-1">{label}</span>
      </div>
    </div>
  )
}

/* ── Controls ───────────────────────────────────────────────────────────────── */
const BTN = {
  primary: 'inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-accent text-white rounded-[10px] text-[0.86rem] font-semibold hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition',
  ghost: 'inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-line text-soft rounded-md text-[0.83rem] font-semibold hover:bg-s2 hover:text-ink hover:border-line-hi disabled:opacity-40 transition',
  danger: 'inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-danger/30 text-danger rounded-md text-[0.83rem] font-semibold hover:bg-danger/10 disabled:opacity-40 transition',
  sm: 'px-2.5 py-1 bg-s2 border border-line rounded-md text-soft text-xs font-medium whitespace-nowrap hover:bg-s3 hover:text-ink hover:border-line-hi disabled:opacity-40 disabled:cursor-not-allowed transition',
  smDanger: 'px-2.5 py-1 bg-s2 border border-danger/30 rounded-md text-danger text-xs font-medium whitespace-nowrap hover:bg-danger/10 hover:border-danger transition',
  smAccent: 'px-2.5 py-1 bg-accent/10 border border-accent/30 rounded-md text-accent text-xs font-medium whitespace-nowrap hover:bg-accent/20 transition',
}

export function Btn({ variant = 'primary', className, children, ...p }) {
  return <button className={cx(BTN[variant], className)} {...p}>{children}</button>
}

export function Chip({ active, children, ...p }) {
  return (
    <button
      className={cx(
        'px-3 py-[5px] rounded-full border text-xs font-medium whitespace-nowrap transition',
        active
          ? 'bg-accent/10 border-accent/30 text-accent'
          : 'bg-s1 border-line text-soft hover:bg-s2 hover:text-ink'
      )}
      {...p}
    >
      {children}
    </button>
  )
}

export function Chips({ children }) {
  return <div className="flex flex-wrap gap-1.5 mb-4">{children}</div>
}

const BADGE = {
  public: 'bg-success/10 text-success',
  group: 'bg-accent/10 text-accent',
  admin: 'bg-purple/10 text-purple',
  owner: 'bg-warning/10 text-warning',
  on: 'bg-success/10 text-success',
  off: 'bg-s2 text-muted',
  err: 'bg-danger/10 text-danger',
}

export function Badge({ tone = 'off', children, className }) {
  return (
    <span className={cx('inline-block px-2 py-0.5 rounded-full text-[0.67rem] font-semibold uppercase tracking-wide whitespace-nowrap', BADGE[tone], className)}>
      {children}
    </span>
  )
}

export function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-block w-10 h-[22px] shrink-0">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
      <span className="absolute inset-0 cursor-pointer rounded-full border border-line bg-s3 transition-colors peer-checked:bg-success peer-checked:border-success/30 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:size-3.5 after:rounded-full after:bg-muted after:transition-all peer-checked:after:translate-x-[18px] peer-checked:after:bg-white" />
    </label>
  )
}

const FIELD = 'w-full px-3.5 py-2.5 bg-s2 border border-line rounded-[10px] text-ink text-[0.88rem] outline-none transition-colors focus:border-accent/50 placeholder:text-muted'

export const Input = ({ className, ...p }) => <input className={cx(FIELD, className)} {...p} />
export const Textarea = ({ className, ...p }) => <textarea className={cx(FIELD, 'resize-y min-h-[120px]', className)} {...p} />

export function Field({ label, hint, children, className }) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label className="text-[0.72rem] font-semibold text-soft uppercase tracking-wider">
        {label} {hint && <span className="normal-case tracking-normal font-normal text-muted">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

export function SearchInput({ className, ...p }) {
  return (
    <input
      className={cx('w-56 2xl:w-72 max-w-full px-3.5 py-2 bg-s1 border border-line rounded-full text-[0.82rem] text-ink outline-none transition-colors focus:border-accent/50 placeholder:text-muted', className)}
      {...p}
    />
  )
}

/* ── Feedback / states ──────────────────────────────────────────────────────── */
export function Spinner({ size = 'size-6', className }) {
  return <span className={cx('inline-block rounded-full border-2 border-s3 border-t-accent animate-spin', size, className)} />
}

export const Loading = () => <div className="p-12 text-center"><Spinner /></div>
export const Empty = ({ children }) => <p className="p-12 text-center text-muted text-[0.84rem]">{children}</p>
export const ErrorState = ({ children }) => <p className="p-12 text-center text-danger text-[0.84rem]">{children}</p>

export function ErrorBox({ children, className }) {
  return <div className={cx('bg-danger/10 border border-danger/30 text-red-300 px-3.5 py-2.5 rounded-md text-[0.8rem]', className)}>{children}</div>
}

export function ProgressBar({ pct, tone = 'bg-accent', className }) {
  return (
    <div className={cx('h-[5px] bg-s3 rounded-full overflow-hidden', className)}>
      <div className={cx('h-full rounded-full transition-[width] duration-500', tone)} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

export const Code = ({ className, children }) => (
  <code className={cx('font-mono text-[0.74rem] bg-s2 px-1.5 py-0.5 rounded', className)}>{children}</code>
)
export const Jid = ({ children, className }) => (
  <span className={cx('font-mono text-[0.64rem] text-muted break-all', className)}>{children}</span>
)

/* ── Table ──────────────────────────────────────────────────────────────────── */
export const TableWrap = ({ children }) => <div className="bg-s1 border border-line rounded-[14px] overflow-auto">{children}</div>
export const Table = ({ children }) => <table className="w-full min-w-[560px] border-collapse">{children}</table>
export const Th = ({ className, children, ...p }) => (
  <th className={cx('bg-s2 text-muted font-semibold text-[0.68rem] uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap 2xl:text-xs', className)} {...p}>{children}</th>
)
export const Tr = ({ className, children, ...p }) => (
  <tr className={cx('border-t border-line hover:bg-s2 transition-colors', className)} {...p}>{children}</tr>
)
export const Td = ({ className, children, ...p }) => (
  <td className={cx('px-4 py-2.5 align-middle text-[0.83rem] 2xl:text-[0.9rem]', className)} {...p}>{children}</td>
)

/* ── Modal ──────────────────────────────────────────────────────────────────── */
export function Modal({ onClose, maxWidth = 'max-w-[540px]', children }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[3px]" onClick={onClose}>
      <div
        className={cx('w-full max-h-[88vh] overflow-y-auto bg-s1 border border-line-hi rounded-[18px] p-[22px] shadow-2xl', maxWidth)}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ title, sub, onClose }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <div className="text-base font-bold mb-1">{title}</div>
        {sub}
      </div>
      <button className="shrink-0 px-2 py-1 rounded-md text-muted hover:text-ink hover:bg-s3 leading-none transition-colors" onClick={onClose}>✕</button>
    </div>
  )
}
