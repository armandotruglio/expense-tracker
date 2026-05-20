import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const INVITE_CODE = import.meta.env.VITE_INVITE_CODE

export default function Login() {
    const { signIn, signUp } = useAuth()

    const [mode, setMode] = useState('login') // 'login' | 'signup'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [invite, setInvite] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [info, setInfo] = useState(null)

    function switchMode(newMode) {
        setMode(newMode)
        setError(null)
        setInfo(null)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        setInfo(null)
        setLoading(true)

        try {
            if (mode === 'signup') {
                // verifica codice invito lato server (consuma il codice se valido)
                const { data: codiceValido, error: rpcError } = await supabase
                    .rpc('verifica_codice_invito', { codice_input: invite })

                if (rpcError) {
                    setError('Errore nella verifica del codice. Riprova.')
                    setLoading(false)
                    return
                }
                if (!codiceValido) {
                    setError('Codice invito non valido o già utilizzato')
                    setLoading(false)
                    return
                }

                const { error } = await signUp(email, password)
                if (error) {
                    setError(error.message)
                } else {
                    setInfo('✅ Registrazione avviata! Controlla la tua email e clicca sul link di conferma per attivare l\'account.')
                }
            } else {
                const { error } = await signIn(email, password)
                if (error) {
                    // messaggio più chiaro se l'email non è confermata
                    if (error.message.toLowerCase().includes('not confirmed')) {
                        setError('Email non ancora confermata. Controlla la tua casella di posta.')
                    } else {
                        setError(error.message)
                    }
                }
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const isSignup = mode === 'signup'

    return (
        <div style={styles.wrap}>
            <form onSubmit={handleSubmit} style={styles.card}>
                <h1 style={styles.title}>💰 Expense Tracker</h1>
                <p style={styles.subtitle}>
                    {isSignup ? 'Crea il tuo account' : 'Accedi al tuo account'}
                </p>

                {/* TOGGLE */}
                <div style={styles.toggle}>
                    <button
                        type="button"
                        onClick={() => switchMode('login')}
                        style={{ ...styles.toggleBtn, ...(!isSignup ? styles.toggleActive : null) }}
                    >
                        Accedi
                    </button>
                    <button
                        type="button"
                        onClick={() => switchMode('signup')}
                        style={{ ...styles.toggleBtn, ...(isSignup ? styles.toggleActive : null) }}
                    >
                        Registrati
                    </button>
                </div>

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
                    minLength={6}
                    style={styles.input}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                />
                {isSignup && (
                    <p style={styles.hint}>Minimo 6 caratteri</p>
                )}

                {/* CODICE INVITO solo in registrazione */}
                {isSignup && (
                    <>
                        <label style={styles.label}>Codice invito</label>
                        <input
                            type="text"
                            value={invite}
                            onChange={(e) => setInvite(e.target.value)}
                            required
                            placeholder="Inserisci il codice ricevuto"
                            style={styles.input}
                        />
                    </>
                )}

                {error && <div style={styles.error}>{error}</div>}
                {info && <div style={styles.info}>{info}</div>}

                <button type="submit" disabled={loading} style={styles.btn}>
                    {loading
                        ? (isSignup ? 'Registrazione…' : 'Accesso…')
                        : (isSignup ? 'Registrati' : 'Accedi')}
                </button>

                {!isSignup && (
                    <p style={styles.footer}>
                        Non hai un account?{' '}
                        <button type="button" onClick={() => switchMode('signup')} style={styles.link}>
                            Registrati
                        </button>
                    </p>
                )}
                {isSignup && (
                    <p style={styles.footer}>
                        Hai già un account?{' '}
                        <button type="button" onClick={() => switchMode('login')} style={styles.link}>
                            Accedi
                        </button>
                    </p>
                )}
            </form>
        </div>
    )
}

const styles = {
    wrap: {
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
        background: 'radial-gradient(circle at 30% 50%, rgba(233,69,96,.15), transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,212,170,.1), transparent 50%), #0f0f1e',
        fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    card: {
        background: '#1e1e2f',
        padding: '2.5rem',
        borderRadius: 16,
        width: 'min(400px, 100%)',
        boxShadow: '0 20px 60px rgba(0,0,0,.4)',
        border: '1px solid rgba(255,255,255,.05)',
        boxSizing: 'border-box',
    },
    title: { color: '#e6e6e6', margin: 0, fontSize: 24 },
    subtitle: { color: '#a0a0a0', marginTop: 4, marginBottom: 20, fontSize: 14 },
    toggle: { display: 'flex', gap: 4, background: '#0f0f1e', padding: 4, borderRadius: 10, marginBottom: 20 },
    toggleBtn: { flex: 1, padding: '8px', background: 'transparent', border: 'none', borderRadius: 8, color: '#a0a0a0', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
    toggleActive: { background: 'rgba(233,69,96,.15)', color: '#e94560' },
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
        boxSizing: 'border-box',
    },
    hint: { color: '#6b7280', fontSize: 11, marginTop: 4, marginBottom: 0 },
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
        marginTop: 16,
        padding: '10px 12px',
        background: 'rgba(255,107,107,.1)',
        border: '1px solid rgba(255,107,107,.3)',
        borderRadius: 8,
        color: '#ff6b6b',
        fontSize: 13,
    },
    info: {
        marginTop: 16,
        padding: '10px 12px',
        background: 'rgba(0,212,170,.1)',
        border: '1px solid rgba(0,212,170,.3)',
        borderRadius: 8,
        color: '#00d4aa',
        fontSize: 13,
        lineHeight: 1.4,
    },
    footer: { color: '#a0a0a0', fontSize: 13, textAlign: 'center', marginTop: 20, marginBottom: 0 },
    link: { background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', padding: 0 },
}