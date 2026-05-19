import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import Home from './components/Home'

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f0f1e', color: '#a0a0a0' }}>
        Caricamento…
      </div>
    )
  }

  return session ? <Home /> : <Login />
}