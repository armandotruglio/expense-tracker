import { useId, useState } from 'react'

export default function Collapsible({ title, badge, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen)
    const contentId = useId()

    return (
        <div style={S.wrap}>
            <button
                onClick={() => setOpen(o => !o)}
                style={S.head}
                aria-expanded={open}
                aria-controls={contentId}
            >
                <span style={{ ...S.arrow, transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }} aria-hidden="true">▸</span>
                <span style={S.title}>{title}</span>
                {badge != null && badge > 0 && (
                    <span style={S.badge} aria-label={`${badge} attivi`}>{badge}</span>
                )}
            </button>
            {open && (
                <div id={contentId} style={S.body}>
                    {children}
                </div>
            )}
        </div>
    )
}

const S = {
    wrap: {
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--line)',
        marginBottom: 20,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
    },
    head: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '16px 20px',
        background: 'transparent',
        border: 'none',
        color: 'var(--text)',
        fontSize: 15,
        fontWeight: 700,
        textAlign: 'left',
    },
    arrow: {
        fontSize: 12,
        color: 'var(--text-muted)',
        width: 14,
        display: 'inline-block',
        transition: 'transform var(--t-fast)',
    },
    title: { flex: 1 },
    badge: {
        background: 'var(--accent-soft)',
        color: 'var(--accent)',
        borderRadius: 'var(--radius-pill)',
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 700,
    },
    body: { padding: '4px 20px 20px', animation: 'slideDown 0.2s ease' },
}
