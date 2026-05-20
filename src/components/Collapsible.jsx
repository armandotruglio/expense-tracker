import { useState } from 'react'

export default function Collapsible({ title, badge, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <div style={S.wrap}>
            <button onClick={() => setOpen(o => !o)} style={S.head}>
                <span style={S.arrow}>{open ? '▾' : '▸'}</span>
                <span style={S.title}>{title}</span>
                {badge != null && badge > 0 && <span style={S.badge}>{badge}</span>}
            </button>
            {open && <div style={S.body}>{children}</div>}
        </div>
    )
}

const S = {
    wrap: { background: '#1e1e2f', borderRadius: 14, border: '1px solid rgba(255,255,255,.05)', marginBottom: 16, overflow: 'hidden' },
    head: {
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px 20px', background: 'transparent', border: 'none',
        color: '#e6e6e6', cursor: 'pointer', fontSize: 16, fontWeight: 600,
        textAlign: 'left',
    },
    arrow: { fontSize: 12, color: '#a0a0a0', width: 14 },
    title: { flex: 1 },
    badge: { background: 'rgba(233,69,96,.2)', color: '#e94560', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600 },
    body: { padding: '0 20px 20px' },
}