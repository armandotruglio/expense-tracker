import { useCallback, useRef, useState } from 'react'
import { ToastContext } from '../hooks/useToast'

export default function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const timers = useRef(new Map())

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
        const tm = timers.current.get(id)
        if (tm) {
            clearTimeout(tm)
            timers.current.delete(id)
        }
    }, [])

    const show = useCallback((message, opts = {}) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const toast = {
            id,
            message: String(message ?? ''),
            tone: opts.tone ?? 'info',
            duration: opts.duration ?? 4500,
        }
        setToasts(prev => [...prev, toast])
        if (toast.duration > 0) {
            const tm = setTimeout(() => dismiss(id), toast.duration)
            timers.current.set(id, tm)
        }
        return id
    }, [dismiss])

    const api = {
        show,
        error:   (msg, opts) => show(msg, { ...opts, tone: 'error' }),
        success: (msg, opts) => show(msg, { ...opts, tone: 'success' }),
        info:    (msg, opts) => show(msg, { ...opts, tone: 'info' }),
        dismiss,
    }

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div
                style={S.container}
                role="region"
                aria-live="polite"
                aria-label="Notifiche"
            >
                {toasts.map(t => (
                    <div
                        key={t.id}
                        role={t.tone === 'error' ? 'alert' : 'status'}
                        style={{ ...S.toast, ...S[`tone_${t.tone}`] }}
                    >
                        <span style={S.message}>{t.message}</span>
                        <button
                            type="button"
                            onClick={() => dismiss(t.id)}
                            aria-label="Chiudi notifica"
                            style={S.close}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

const S = {
    container: {
        position: 'fixed',
        bottom: 'calc(16px + var(--safe-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1200,
        pointerEvents: 'none',
        width: 'min(420px, calc(100% - 24px))',
    },
    toast: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        fontSize: 13.5,
        lineHeight: 1.4,
        pointerEvents: 'auto',
        animation: 'slideUp .2s ease',
    },
    message: { flex: 1, minWidth: 0, wordBreak: 'break-word' },
    close: {
        background: 'transparent',
        border: 'none',
        color: 'inherit',
        opacity: 0.7,
        fontSize: 13,
        padding: 0,
        marginLeft: 4,
        cursor: 'pointer',
        flexShrink: 0,
    },
    tone_error: {
        background: 'var(--danger-soft)',
        border: '1px solid var(--danger-ring)',
        color: 'var(--danger)',
    },
    tone_success: {
        background: 'var(--success-soft)',
        border: '1px solid var(--success-ring)',
        color: 'var(--success)',
    },
    tone_info: {
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        color: 'var(--text)',
    },
}
