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
import Logs from './pages/Logs.jsx'
import DirectMessage from './pages/DirectMessage.jsx'
import Settings from './pages/Settings.jsx'
import { Spinner } from './components/ui.jsx'

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
    <div className="flex items-center justify-center h-screen bg-bg"><Spinner /></div>
  )
  if (auth === false) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

// ── Toast component ────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`min-w-[200px] max-w-[300px] rounded-[10px] border border-line bg-s2 px-4 py-2.5 text-[0.82rem] font-medium shadow-2xl border-l-[3px] ${t.ok ? 'border-l-success' : 'border-l-danger'}`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── App root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(null) // null=loading, true/false
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  useEffect(() => {
    fetch('/api/admin/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setAuth(data.authenticated === true)
        setGoogleAuthEnabled(!!data.googleAuthEnabled)
      })
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
    <AuthCtx.Provider value={{ auth, setAuth, googleAuthEnabled }}>
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
                    <Route path="logs" element={<Logs />} />
                    <Route path="dm" element={<DirectMessage />} />
                    <Route path="settings" element={<Settings />} />
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
