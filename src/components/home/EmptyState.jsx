export default function EmptyState({ title, message, action }) {
    return (
        <div style={S.empty}>
            <div style={S.emptyIcon} aria-hidden="true">📭</div>
            <div style={S.emptyTitle}>{title}</div>
            <div style={S.emptyMsg}>{message}</div>
            {action && (
                <button onClick={action.onClick} style={S.emptyBtn} className="ix-btn-primary">
                    {action.label}
                </button>
            )}
        </div>
    )
}

const S = {
    empty: {
        textAlign: 'center',
        padding: '40px 20px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--line)',
    },
    emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.6 },
    emptyTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
    emptyMsg: { color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 },
    emptyBtn: {
        padding: '10px 18px',
        background: 'var(--grad-hero)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        fontWeight: 700,
        fontSize: 13,
        boxShadow: 'var(--shadow-coral)',
    },
}
