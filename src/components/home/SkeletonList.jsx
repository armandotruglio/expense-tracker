export default function SkeletonList() {
    return (
        <div style={S.skelWrap} aria-hidden="true">
            {[0, 1, 2].map(i => (
                <div key={i} style={S.skelItem}>
                    <div style={S.skelIcon} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ ...S.skelLine, width: '60%' }} />
                        <div style={{ ...S.skelLine, width: '40%', height: 10 }} />
                    </div>
                    <div style={{ ...S.skelLine, width: 60 }} />
                </div>
            ))}
        </div>
    )
}

const S = {
    skelWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
    skelItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--line)',
    },
    skelIcon: {
        width: 40, height: 40,
        borderRadius: 12,
        background: 'linear-gradient(90deg, var(--bg-2), var(--surface-3), var(--bg-2))',
        backgroundSize: '400px 100%',
        animation: 'shimmer 1.4s linear infinite',
    },
    skelLine: {
        height: 12,
        borderRadius: 6,
        background: 'linear-gradient(90deg, var(--bg-2), var(--surface-3), var(--bg-2))',
        backgroundSize: '400px 100%',
        animation: 'shimmer 1.4s linear infinite',
    },
}
