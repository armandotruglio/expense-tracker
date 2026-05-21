export default function Kpi({ label, value, sub }) {
    return (
        <div style={S.kpi}>
            <div style={S.kpiLbl}>{label}</div>
            <div style={S.kpiVal} className="num">{value}</div>
            {sub && <div style={S.kpiSub}>{sub}</div>}
        </div>
    )
}

export function KpiRow({ children }) {
    return <div style={S.kpis}>{children}</div>
}

export function MStat({ label, value, color }) {
    return (
        <div style={S.mStat}>
            <div style={S.kpiLbl}>{label}</div>
            <div style={{ ...S.mStatVal, color }} className="num">{value}</div>
        </div>
    )
}

export function MStatRow({ children }) {
    return <div style={S.mQuickStats}>{children}</div>
}

const S = {
    kpis: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        background: 'var(--line)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        marginBottom: 28,
        boxShadow: 'var(--shadow-sm)',
    },
    kpi: { background: 'var(--surface)', padding: '18px 22px 20px' },
    kpiLbl: {
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontWeight: 700,
        marginBottom: 8,
    },
    kpiVal: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    kpiSub: { marginTop: 4, fontSize: 12, color: 'var(--text-muted)' },

    mQuickStats: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        padding: '0 18px',
        marginBottom: 20,
    },
    mStat: {
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        boxShadow: 'var(--shadow-sm)',
    },
    mStatVal: { fontSize: 18, fontWeight: 800, marginTop: 4 },
}
