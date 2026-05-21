import { useCallback, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import Home from './components/Home'
import Categorie from './components/Categorie'
import Ricorrenti from './components/Ricorrenti'
import Layout from './components/Layout'
import ToastProvider from './components/ToastProvider'

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={loadingStyles}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={spinnerStyles} aria-hidden="true" />
          <span>Caricamento…</span>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        {!session ? (
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        ) : (
          <AppShell />
        )}
      </BrowserRouter>
    </ToastProvider>
  )
}

function AppShell() {
  const [createTrigger, setCreateTrigger] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  const handleAddClick = useCallback(() => {
    if (location.pathname !== '/') navigate('/')
    setCreateTrigger(t => t + 1)
  }, [navigate, location.pathname])

  const handleCreateConsumed = useCallback(() => {
    setCreateTrigger(0)
  }, [])

  return (
    <Layout onAddClick={handleAddClick}>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              openCreateTrigger={createTrigger}
              onCreateConsumed={handleCreateConsumed}
            />
          }
        />
        <Route path="/categorie" element={<Categorie />} />
        <Route path="/ricorrenti" element={<Ricorrenti />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

const loadingStyles = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--bg)',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-sans)',
}

const spinnerStyles = {
  width: 18,
  height: 18,
  border: '2px solid var(--line-2)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
}
