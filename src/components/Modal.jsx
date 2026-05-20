import { useEffect, useRef, useId } from 'react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
    const dialogRef = useRef(null)
    const lastFocusedRef = useRef(null)
    const titleId = useId()

    useEffect(() => {
        if (!open) return

        lastFocusedRef.current = document.activeElement

        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation()
                onClose()
                return
            }
            if (e.key === 'Tab' && dialogRef.current) {
                const focusables = dialogRef.current.querySelectorAll(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
                if (focusables.length === 0) return
                const first = focusables[0]
                const last = focusables[focusables.length - 1]
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault()
                    last.focus()
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault()
                    first.focus()
                }
            }
        }

        document.addEventListener('keydown', onKey)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        requestAnimationFrame(() => {
            if (!dialogRef.current) return
            const focusable = dialogRef.current.querySelector(
                'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled])'
            )
            ; (focusable ?? dialogRef.current).focus()
        })

        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = prevOverflow
            if (lastFocusedRef.current && typeof lastFocusedRef.current.focus === 'function') {
                lastFocusedRef.current.focus()
            }
        }
    }, [open, onClose])

    if (!open) return null

    const widthMap = { sm: 400, md: 520, lg: 720 }
    const maxW = widthMap[size] ?? widthMap.md

    return (
        <div style={S.overlay} onClick={onClose}>
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                style={{ ...S.modal, width: `min(${maxW}px, 100%)` }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={S.head}>
                    <h2 id={titleId} style={S.title}>{title}</h2>
                    <button
                        onClick={onClose}
                        style={S.close}
                        aria-label="Chiudi finestra"
                        className="ix-btn-icon"
                    >
                        ✕
                    </button>
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
        background: 'rgba(42, 27, 61, 0.5)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '5vh 1rem 1rem',
        overflowY: 'auto',
        animation: 'fadeIn .15s ease',
    },
    modal: {
        background: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'slideUp .2s ease',
        outline: 'none',
    },
    head: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px', borderBottom: '1px solid var(--line)',
    },
    title: {
        margin: 0,
        fontSize: 20,
        fontFamily: 'var(--font-serif)',
        fontWeight: 500,
        letterSpacing: '-0.02em',
        color: 'var(--text)',
    },
    close: {
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text)',
        fontSize: 14,
        width: 36, height: 36,
        display: 'grid', placeItems: 'center',
    },
    body: { padding: 24 },
}
