import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children }) {
    // chiusura con Esc + blocco scroll del body quando aperta
    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prevOverflow
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <div style={S.overlay} onClick={onClose}>
            <div style={S.modal} onClick={(e) => e.stopPropagation()}>
                <div style={S.head}>
                    <h2 style={S.title}>{title}</h2>
                    <button onClick={onClose} style={S.close} aria-label="Chiudi">✕</button>
                </div>
                <div style={S.body}>
                    {children}
                </div>
            </div>
        </div>
    )
}

const S = {
    overlay: {
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '5vh 1rem 1rem',
        overflowY: 'auto',
        animation: 'fadeIn .15s ease',
    },
    modal: {
        background: '#1e1e2f',
        borderRadius: 16,
        width: 'min(520px, 100%)',
        border: '1px solid rgba(255,255,255,.08)',
        boxShadow: '0 30px 80px rgba(0,0,0,.5)',
        animation: 'slideUp .2s ease',
    },
    head: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,.06)',
    },
    title: { margin: 0, fontSize: 18, color: '#e6e6e6' },
    close: {
        background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
        borderRadius: 8, color: '#e6e6e6', cursor: 'pointer', fontSize: 14,
        width: 32, height: 32, display: 'grid', placeItems: 'center',
    },
    body: { padding: 24 },
}