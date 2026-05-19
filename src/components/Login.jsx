import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
    const { signIn } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        const { error } = await signIn(email, password)
        if (error) setError(error.message)
        setLoading(false)
    }

    return (
        <div style={styles.wrap}>
            <form onSubmit={handleSubmit} style={styles.card}>
                <h1 style={styles.title}>💰 Expense Tracker</h1>
                <p style={styles.subtitle}>Accedi al tuo account</p>

                <label style={styles.label}>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={styles.input}
                    autoComplete="email"
                />

                <label style={styles.label}>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={styles.input}
                    autoComplete="current-password"
                />

                {error && <div style={styles.error}>{error}</div>}

                <button type="submit" disabled={loading} style={styles.btn}>
                    {loading ? 'Accesso…' : 'Accedi'}
                </button>
            </form>
        </div>
    )
}

const styles = {
    wrap: {
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(circle at 30% 50%, rgba(233,69,96,.15), transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,212,170,.1), transparent 50%), #0f0f1e',
        fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    card: {
        background: '#1e1e2f',
        padding: '2.5rem',
        borderRadius: 16,
        width: 'min(400px, 90vw)',
        boxShadow: '0 20px 60px rgba(0,0,0,.4)',
        border: '1px solid rgba(255,255,255,.05)',
    },
    title: { color: '#e6e6e6', margin: 0, fontSize: 24 },
    subtitle: { color: '#a0a0a0', marginTop: 4, marginBottom: 24, fontSize: 14 },
    label: { color: '#a0a0a0', fontSize: 12, marginTop: 12, display: 'block' },
    input: {
        width: '100%',
        padding: '12px 14px',
        marginTop: 6,
        background: '#0f0f1e',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 10,
        color: '#e6e6e6',
        fontSize: 14,
        outline: 'none',
    },
    btn: {
        width: '100%',
        marginTop: 24,
        padding: '12px',
        background: 'linear-gradient(135deg, #e94560, #ff6b6b)',
        border: 'none',
        borderRadius: 10,
        color: 'white',
        fontWeight: 600,
        fontSize: 15,
        cursor: 'pointer',
    },
    error: {
        marginTop: 12,
        padding: '10px 12px',
        background: 'rgba(255,107,107,.1)',
        border: '1px solid rgba(255,107,107,.3)',
        borderRadius: 8,
        color: '#ff6b6b',
        fontSize: 13,
    },
}