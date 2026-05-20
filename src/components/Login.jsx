import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function Login() {
    const { signIn, signUp } = useAuth()

    const [mode, setMode] = useState('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
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
                const { data: codiceValido, error: rpcError } = await supabase
                    .rpc('verifica_codice_invito', { codice_input: invite.trim() })

                if (rpcError) { setError('Errore nella verifica del codice. Riprova.'); setLoading(false); return }
                if (!codiceValido) { setError('Codice invito non valido o già utilizzato'); setLoading(false); return }

                const { error } = await signUp(email, password)
                if (error) setError(error.message)
                else setInfo('✅ Registrazione avviata! Controlla la tua email e clicca sul link di conferma per attivare l\'account.')
            } else {
                const { error } = await signIn(email, password)
                if (error) {
                    if (error.message.toLowerCase().includes('not confirmed')) {
                        setError('Email non ancora confermata. Controlla la tua casella di posta.')
                    } else setError(error.message)
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
        <div style={S.wrap}>
            <form onSubmit={handleSubmit} style={S.card} noValidate>
                <div style={S.brandRow}>
                    <span style={S.brandMark}>€</span>
                    <h1 style={S.brand}>Spese</h1>
                </div>
                <p style={S.ciao}>
                    {isSignup ? 'Crea il tuo account' : 'Ciao! Bentornato 👋'}
                </p>

                <div style={S.toggle} role="tablist" aria-label="Modalità autenticazione">
                    <button
                        type="button"
                        onClick={() => switchMode('login')}
                        role="tab"
                        aria-selected={!isSignup}
                        style={{ ...S.toggleBtn, ...(!isSignup ? S.toggleActive : null) }}
                    >
                        Accedi
                    </button>
                    <button
                        type="button"
                        onClick={() => switchMode('signup')}
                        role="tab"
                        aria-selected={isSignup}
                        style={{ ...S.toggleBtn, ...(isSignup ? S.toggleActive : null) }}
                    >
                        Registrati
                    </button>
                </div>

                <label style={S.label} htmlFor="login-email">Email</label>
                <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={S.input}
                    autoComplete="email"
                    inputMode="email"
                    spellCheck="false"
                />

                <label style={S.label} htmlFor="login-password">Password</label>
                <div style={S.passwordWrap}>
                    <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        style={{ ...S.input, paddingRight: 44 }}
                        autoComplete={isSignup ? 'new-password' : 'current-password'}
                        aria-describedby={isSignup ? 'pwd-hint' : undefined}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        style={S.eyeBtn}
                        aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                        aria-pressed={showPassword}
                        className="ix-btn-icon"
                    >
                        {showPassword ? '🙈' : '👁️'}
                    </button>
                </div>
                {isSignup && <p style={S.hint} id="pwd-hint">Minimo 6 caratteri</p>}

                {isSignup && (
                    <>
                        <label style={S.label} htmlFor="login-invite">Codice invito</label>
                        <input
                            id="login-invite"
                            type="text"
                            value={invite}
                            onChange={(e) => setInvite(e.target.value.toUpperCase())}
                            required
                            placeholder="Inserisci il codice ricevuto"
                            style={{ ...S.input, letterSpacing: 1, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                            autoCapitalize="characters"
                            autoCorrect="off"
                            spellCheck="false"
                        />
                    </>
                )}

                {error && <div role="alert" style={S.error}>{error}</div>}
                {info && <div role="status" style={S.info}>{info}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    style={S.btn}
                    className="ix-btn-primary"
                >
                    {loading ? (isSignup ? 'Registrazione…' : 'Accesso…') : (isSignup ? 'Crea account' : 'Accedi')}
                </button>

                <p style={S.footer}>
                    {isSignup ? 'Hai già un account? ' : 'Non hai un account? '}
                    <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')} style={S.link}>
                        {isSignup ? 'Accedi' : 'Registrati'}
                    </button>
                </p>
            </form>
        </div>
    )
}

const S = {
    wrap: {
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
        paddingTop: 'calc(1rem + var(--safe-top))',
        paddingBottom: 'calc(1rem + var(--safe-bottom))',
        background: 'var(--grad-bg)',
    },
    card: {
        background: 'var(--surface)',
        padding: '2.5rem',
        borderRadius: 'var(--radius-xl)',
        width: 'min(420px, 100%)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--line)',
    },
    brandRow: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 },
    brandMark: {
        fontFamily: 'var(--font-serif)',
        fontSize: 36,
        fontWeight: 500,
        color: 'var(--accent)',
        lineHeight: 1,
    },
    brand: {
        fontFamily: 'var(--font-serif)',
        fontSize: 28,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        margin: 0,
        color: 'var(--text)',
    },
    ciao: {
        fontFamily: 'var(--font-hand)',
        color: 'var(--lavender)',
        fontSize: 22,
        marginTop: 0,
        marginBottom: 24,
        fontWeight: 600,
    },
    toggle: {
        display: 'flex',
        gap: 4,
        background: 'var(--bg-2)',
        padding: 4,
        borderRadius: 'var(--radius-md)',
        marginBottom: 20,
    },
    toggleBtn: {
        flex: 1,
        padding: '10px',
        background: 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-muted)',
        fontSize: 13,
        fontWeight: 600,
        transition: 'background-color var(--t-fast), color var(--t-fast)',
    },
    toggleActive: {
        background: 'var(--surface)',
        color: 'var(--accent)',
        boxShadow: 'var(--shadow-sm)',
    },
    label: { color: 'var(--text-muted)', fontSize: 12, marginTop: 14, display: 'block', fontWeight: 600 },
    input: {
        width: '100%',
        padding: '12px 14px',
        marginTop: 6,
        background: 'var(--bg-2)',
        border: '1px solid transparent',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text)',
        fontSize: 14,
        outline: 'none',
        transition: 'border-color var(--t-fast), box-shadow var(--t-fast)',
    },
    passwordWrap: { position: 'relative' },
    eyeBtn: {
        position: 'absolute',
        right: 6,
        top: '50%',
        transform: 'translateY(-50%)',
        marginTop: 3,
        background: 'transparent',
        border: 'none',
        fontSize: 18,
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-sm)',
        opacity: 0.7,
    },
    hint: { color: 'var(--text-subtle)', fontSize: 11, marginTop: 4, marginBottom: 0 },
    btn: {
        width: '100%',
        marginTop: 24,
        padding: '14px',
        background: 'var(--grad-hero)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        fontWeight: 700,
        fontSize: 15,
        boxShadow: 'var(--shadow-coral)',
    },
    error: {
        marginTop: 16,
        padding: '10px 12px',
        background: 'var(--danger-soft)',
        border: '1px solid var(--danger-ring)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--danger)',
        fontSize: 13,
    },
    info: {
        marginTop: 16,
        padding: '10px 12px',
        background: 'var(--success-soft)',
        border: '1px solid var(--success-ring)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--success)',
        fontSize: 13,
        lineHeight: 1.4,
    },
    footer: { color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 20, marginBottom: 0 },
    link: {
        background: 'none',
        border: 'none',
        color: 'var(--accent)',
        fontSize: 13,
        fontWeight: 700,
        textDecoration: 'underline',
        padding: 0,
    },
}
