import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login } from '../lib/api.js'
import { useAuth } from '../App.jsx'
import { reconnectWs } from '../hooks/wsClient.js'
import { Btn, ErrorBox, Field, Input, Spinner } from '../components/ui.jsx'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { auth, setAuth, googleAuthEnabled } = useAuth()
  const navigate                = useNavigate()
  const location                = useLocation()
  const from                    = location.state?.from?.pathname || '/'

  // Pick up error from Google OAuth redirect query param
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const err = params.get('error')
    if (err === 'not_allowed') setError('Google account not authorised as admin.')
    else if (err === 'google_failed') setError('Google sign-in failed. Try again.')
  }, [location.search])

  // Already logged in
  if (auth === true) { navigate(from, { replace: true }); return null }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(password)
      setAuth(true)
      reconnectWs()
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="w-full max-w-[340px] bg-s1 border border-line rounded-[18px] p-8">
        <div className="text-center mb-6 pb-6 border-b border-line">
          <img src="/eva.jpg" alt="Eva" className="size-14 rounded-2xl object-cover border border-line mx-auto mb-3" />
          <h1 className="text-[1.1rem] font-bold">Eva Bot</h1>
          <p className="text-xs text-muted mt-1">Admin Panel — Restricted Access</p>
        </div>

        {error && <ErrorBox className="mb-3.5">{error}</ErrorBox>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <Field label="Password">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              required
            />
          </Field>
          <Btn type="submit" disabled={loading} className="py-[11px]">
            {loading ? <><Spinner size="size-4" /> Signing in…</> : 'Sign In'}
          </Btn>
        </form>

        {googleAuthEnabled && (
          <>
            <div className="flex items-center gap-2.5 mt-4 mb-3">
              <hr className="flex-1 border-t border-line" />
              <span className="text-muted text-xs">or</span>
              <hr className="flex-1 border-t border-line" />
            </div>

            <a
              href="/auth/google"
              className="flex items-center justify-center gap-2 py-[11px] border border-line rounded-lg text-[0.83rem] font-semibold hover:bg-s2 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              Sign in with Google
            </a>
          </>
        )}
      </div>
    </div>
  )
}
