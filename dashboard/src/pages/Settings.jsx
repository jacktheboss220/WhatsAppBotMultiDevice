import { useState, useEffect } from 'react'
import { getYtCookies, saveYtCookies } from '../lib/api.js'
import { useToast } from '../App.jsx'
import { Badge, Btn, Card, Code, Loading, PageHeader, Textarea } from '../components/ui.jsx'

export default function Settings() {
  const toast = useToast()
  const [cookies, setCookies] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasStored, setHasStored] = useState(false)

  useEffect(() => {
    getYtCookies()
      .then(d => {
        setCookies(d.content || '')
        setHasStored(!!(d.content && d.content.trim()))
      })
      .catch(() => toast('Failed to load cookies', false))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await saveYtCookies(cookies)
      setHasStored(!!(cookies && cookies.trim()))
      toast('Cookies saved')
    } catch (e) {
      toast(e.message || 'Save failed', false)
    } finally {
      setSaving(false)
    }
  }

  async function handleClear() {
    setSaving(true)
    try {
      await saveYtCookies('')
      setCookies('')
      setHasStored(false)
      toast('Cookies cleared')
    } catch (e) {
      toast(e.message || 'Clear failed', false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <PageHeader title="Settings" sub="Manage bot configuration" />

      <Card className="p-7">
        <div className="flex items-center gap-2.5 mb-2">
          <h3 className="text-base font-semibold">YouTube Cookies</h3>
          <Badge tone={hasStored ? 'on' : 'off'}>{hasStored ? 'Active' : 'Not set'}</Badge>
        </div>
        <p className="text-soft text-[0.8rem] mb-4 leading-relaxed">
          Paste Netscape-format cookies exported from a logged-in browser (use a browser extension like
          "Get cookies.txt LOCALLY"). Required for age-restricted or "Sign in to confirm" errors on
          YouTube commands (<Code>-yt</Code>, <Code>-song</Code>, <Code>-yta</Code>).
        </p>

        {loading ? (
          <Loading />
        ) : (
          <>
            <Textarea
              value={cookies}
              onChange={e => setCookies(e.target.value)}
              placeholder={'# Netscape HTTP Cookie File\n# Export from browser using "Get cookies.txt" extension\n\n.youtube.com\tTRUE\t/\tTRUE\t...\t...\t...'}
              spellCheck={false}
              className="min-h-[320px] font-mono text-xs leading-normal bg-bg"
            />
            <div className="flex gap-2.5 mt-3.5">
              <Btn onClick={handleSave} disabled={saving} className="min-w-[100px]">
                {saving ? 'Saving…' : 'Save'}
              </Btn>
              {hasStored && (
                <Btn variant="danger" onClick={handleClear} disabled={saving}>Clear Cookies</Btn>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
