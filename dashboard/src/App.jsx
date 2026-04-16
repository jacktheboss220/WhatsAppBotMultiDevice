import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Commands from './pages/Commands.jsx'
import Groups from './pages/Groups.jsx'
import Members from './pages/Members.jsx'
import Analytics from './pages/Analytics.jsx'
import Broadcast from './pages/Broadcast.jsx'
import Health from './pages/Health.jsx'

// ── Contexts ───────────────────────────────────────────────────────────────────
export const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

export const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

// ── Auth guard ─────────────────────────────────────────────────────────────────
function AuthGuard({ children }) {
  const { auth } = useAuth()
  const location = useLocation()
  if (auth === null) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  )
  if (auth === false) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

// ── Toast component ────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000 }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast show ${t.ok ? 'ok' : 'err'}`}>{t.msg}</div>
      ))}
    </div>
  )
}

// ── App root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(null) // null=loading, true/false
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  useEffect(() => {
    fetch('/api/admin/me', { credentials: 'include' })
      .then(r => setAuth(r.ok))
      .catch(() => setAuth(false))
  }, [])

  const showToast = useCallback((msg, ok = true) => {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, msg, ok }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }, [])

  // In dev: base is '/', in prod: base is '/admin/'
  const base = import.meta.env.BASE_URL
  const basename = base === '/' ? '' : base.replace(/\/$/, '')

  return (
    <AuthCtx.Provider value={{ auth, setAuth }}>
      <ToastCtx.Provider value={showToast}>
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <AuthGuard>
                <Layout>
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="commands" element={<Commands />} />
                    <Route path="groups" element={<Groups />} />
                    <Route path="members" element={<Members />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="broadcast" element={<Broadcast />} />
                    <Route path="health" element={<Health />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </AuthGuard>
            } />
          </Routes>
        </BrowserRouter>
        <Toast toasts={toasts} />
      </ToastCtx.Provider>
    </AuthCtx.Provider>
  )
}
