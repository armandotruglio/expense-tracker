import { formatEUR } from '../../utils/format'

// Barra compatta del budget totale, mostrata sopra le sezioni principali.
export default function BudgetSummary({ totSpese, budgetTotale, pct }) {
    if (budgetTotale <= 0) return null

    return (
        <div style={S.budgetCard}>
            <div style={S.budgetHead}>
                <span style={S.budgetLabel}>Budget totale</span>
                <span style={S.budgetVal} className="num">
                    {formatEUR(totSpese)}
                    <span style={{ color: 'var(--text-muted)' }}> / {formatEUR(budgetTotale)}</span>
                </span>
            </div>
            <div
                style={S.progress}
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div style={{
                    ...S.progressBar,
                    width: `${pct}%`,
                    background: pct >= 100
                        ? 'var(--accent)'
                        : pct >= 80
                            ? 'var(--warning)'
                            : 'var(--success)',
                }} />
            </div>
        </div>
    )
}

const S = {
    budgetCard: {
        background: 'var(--surface)',
        padding: '14px 18px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 24,
        marginLeft: 18,
        marginRight: 18,
    },
    budgetHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' },
    budgetLabel: {
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontWeight: 700,
    },
    budgetVal: { fontSize: 14, fontWeight: 700 },
    progress: { height: 6, background: 'var(--bg-2)', borderRadius: 999, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 999, transition: 'width .3s ease, background .3s' },
}
