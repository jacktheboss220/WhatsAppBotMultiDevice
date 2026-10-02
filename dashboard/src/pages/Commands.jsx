import { useEffect, useState, useMemo } from 'react'
import { getCommands, toggleCommand, getCommandStats } from '../lib/api.js'
import { useToast } from '../App.jsx'
import {
  Badge, Chip, Chips, Code, Empty, Loading, PageHeader, ProgressBar, SearchInput,
  Table, TableWrap, Td, Th, Toggle, Tr, cx,
} from '../components/ui.jsx'

const TYPE_FILTERS = ['all', 'public', 'group', 'admin', 'owner']

export default function Commands() {
  const toast = useToast()
  const [all,     setAll]     = useState([])
  const [stats,   setStats]   = useState({})
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    Promise.all([getCommands(), getCommandStats().catch(() => ({ stats: {} }))])
      .then(([d, s]) => {
        setStats(s.stats || {})
        setAll([
          ...(d.publicCommands || []).map(c => ({ ...c, type: 'public' })),
          ...(d.groupCommands  || []).map(c => ({ ...c, type: 'group' })),
          ...(d.adminCommands  || []).map(c => ({ ...c, type: 'admin' })),
          ...(d.ownerCommands  || []).map(c => ({ ...c, type: 'owner' })),
        ])
      })
      .catch(() => toast('Failed to load commands', false))
      .finally(() => setLoading(false))
  }, [])

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return all.filter(c => {
      if (filter !== 'all' && c.type !== filter) return false
      if (q && !c.cmd.join(' ').toLowerCase().includes(q) && !(c.desc || '').toLowerCase().includes(q)) return false
      return true
    })
  }, [all, filter, search])

  async function handleToggle(cmd, aliases, currentlyDisabled) {
    const newDisabled = !currentlyDisabled
    // Optimistic update
    setAll(prev => prev.map(c =>
      c.cmd.some(k => aliases.includes(k)) ? { ...c, disabledGlobally: newDisabled } : c
    ))
    try {
      await toggleCommand(cmd, newDisabled, aliases)
      toast(newDisabled ? `🚫 ${cmd} disabled` : `✅ ${cmd} enabled`)
    } catch (err) {
      // Revert
      setAll(prev => prev.map(c =>
        c.cmd.some(k => aliases.includes(k)) ? { ...c, disabledGlobally: currentlyDisabled } : c
      ))
      toast(err.message, false)
    }
  }

  const enabledCount  = all.filter(c => !c.disabledGlobally).length
  const disabledCount = all.filter(c =>  c.disabledGlobally).length
  const maxUses = Math.max(1, ...Object.values(stats))

  return (
    <div>
      <PageHeader
        title="Commands"
        sub={
          <>
            {all.length} total · <span className="text-success">{enabledCount} enabled</span> ·{' '}
            <span className="text-danger">{disabledCount} disabled</span>
          </>
        }
      >
        <SearchInput placeholder="Search commands…" value={search} onChange={e => setSearch(e.target.value)} />
      </PageHeader>

      <Chips>
        {TYPE_FILTERS.map(f => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Chip>
        ))}
      </Chips>

      {loading ? (
        <Loading />
      ) : (
        <TableWrap>
          {rows.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Command(s)</Th>
                  <Th>Type</Th>
                  <Th>Description</Th>
                  <Th>Usage</Th>
                  <Th>Uses</Th>
                  <Th>Enabled</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(c => {
                  const uses = c.cmd.reduce((acc, k) => acc + (stats[k] || 0), 0)
                  const pct  = Math.round((uses / maxUses) * 100)
                  return (
                    <Tr key={`${c.type}-${c.cmd[0]}`}>
                      <Td className={cx(c.disabledGlobally && 'opacity-35')}>
                        <strong className="font-mono text-[0.82rem]">{c.cmd.join(', ')}</strong>
                      </Td>
                      <Td className={cx(c.disabledGlobally && 'opacity-35')}><Badge tone={c.type}>{c.type}</Badge></Td>
                      <Td className={cx('text-soft max-w-[280px]', c.disabledGlobally && 'opacity-35')}>{c.desc || '—'}</Td>
                      <Td className={cx(c.disabledGlobally && 'opacity-35')}><Code>{c.usage || c.cmd[0]}</Code></Td>
                      <Td className={cx('min-w-[80px]', c.disabledGlobally && 'opacity-35')}>
                        <div className="flex items-center gap-1.5">
                          <ProgressBar pct={pct} className="flex-1 h-1" />
                          <span className="min-w-6 text-right text-[0.72rem] text-muted">{uses || 0}</span>
                        </div>
                      </Td>
                      <Td>
                        <Toggle checked={!c.disabledGlobally} onChange={() => handleToggle(c.cmd[0], c.cmd, c.disabledGlobally)} />
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          ) : (
            <Empty>No commands match your search.</Empty>
          )}
        </TableWrap>
      )}
    </div>
  )
}
