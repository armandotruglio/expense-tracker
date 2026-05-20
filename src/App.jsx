import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import Home from './components/Home'
import Categorie from './components/Categorie'

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={loadingStyles}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={spinnerStyles} aria-hidden="true" />
          <span>Caricamento…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <BrowserRouter>
      {!session ? (
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categorie" element={<Categorie />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </BrowserRouter>
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
  border: '2px solid rgba(255,255,255,0.15)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
}
