import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login } from '../lib/api.js'
import { useAuth } from '../App.jsx'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { auth, setAuth }       = useAuth()
  const navigate                = useNavigate()
  const location                = useLocation()
  const from                    = location.state?.from?.pathname || '/'

  // Already logged in
  if (auth === true) { navigate(from, { replace: true }); return null }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(password)
      setAuth(true)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <img src="/eva.jpg" alt="Eva" />
          <h1>Eva Bot</h1>
          <p>Admin Panel — Restricted Access</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ justifyContent: 'center', padding: '11px' }}
          >
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
