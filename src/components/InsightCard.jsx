export default function InsightCard({ insights, variant = 'mobile' }) {
    if (!insights || insights.length === 0) return null

    const first = insights[0]

    if (variant === 'desktop') {
        return (
            <div style={S.deskWrap}>
                {insights.map(i => (
                    <div key={i.id} style={{ ...S.deskItem, borderLeftColor: toneColor(i.tone) }}>
                        <div style={{ ...S.deskIcon, background: toneSoft(i.tone) }}>{i.icon}</div>
                        <div style={S.deskBody}>{i.text}</div>
                    </div>
                ))}
            </div>
        )
    }

    // mobile: hero card colorata col primo insight + cards minori
    return (
        <div>
            <div style={S.mobMain} className="ix-lift">
                <div style={S.mobIcon}>{first.icon}</div>
                <div style={S.mobBody}>{first.text}</div>
            </div>
            {insights.slice(1).map(i => (
                <div
                    key={i.id}
                    style={{ ...S.mobSecondary, borderLeftColor: toneColor(i.tone) }}
                >
                    <span style={S.mobSecondaryIcon}>{i.icon}</span>
                    <span>{i.text}</span>
                </div>
            ))}
        </div>
    )
}

function toneColor(tone) {
    switch (tone) {
        case 'good': return 'var(--success)'
        case 'warn': return 'var(--warning)'
        case 'bad': return 'var(--accent)'
        default: return 'var(--lavender)'
    }
}

function toneSoft(tone) {
    switch (tone) {
        case 'good': return 'var(--success-soft)'
        case 'warn': return '#fff3c4'
        case 'bad': return 'var(--rose-soft)'
        default: return 'var(--lavender-soft)'
    }
}

const S = {
    // Mobile playful
    mobMain: {
        background: 'var(--grad-purple)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 22px',
        color: 'white',
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        boxShadow: 'var(--shadow-purple)',
        marginBottom: 12,
    },
    mobIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        background: 'rgba(255, 255, 255, 0.22)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 24,
        flexShrink: 0,
    },
    mobBody: { lineHeight: 1.35, fontSize: 13.5, fontWeight: 500 },
    mobSecondary: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderLeft: '3px solid',
        borderRadius: 'var(--radius-sm)',
        fontSize: 13,
        color: 'var(--text-2)',
        marginBottom: 8,
    },
    mobSecondaryIcon: { fontSize: 18 },

    // Desktop editoriale neutro
    deskWrap: { display: 'flex', flexDirection: 'column', gap: 10 },
    deskItem: {
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        padding: '16px 18px',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderLeft: '3px solid',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
    },
    deskIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        display: 'grid',
        placeItems: 'center',
        fontSize: 20,
        flexShrink: 0,
    },
    deskBody: { fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.4 },
}
