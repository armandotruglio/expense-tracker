import { useMemo } from 'react'
import { formatEUR } from '../../utils/format'

// `perCategoria` è una Map<id, { totale, ... }> già aggregata (vedi utils/stats.js).
export default function BudgetList({ categorie, perCategoria }) {
    const stat = useMemo(() => {
        return categorie
            .filter(c => Number(c.budget_mensile ?? 0) > 0)
            .map(c => {
                const speso = perCategoria.get(c.id)?.totale ?? 0
                return {
                    ...c,
                    speso,
                    pct: Math.min(100, (speso / c.budget_mensile) * 100),
                }
            })
            .sort((a, b) => b.pct - a.pct)
    }, [categorie, perCategoria])

    if (stat.length === 0) {
        return (
            <div style={S.emptyBudget}>
                Nessun budget impostato. Vai in <a href="/categorie" style={S.linkInline}>Categorie</a> per crearne uno.
            </div>
        )
    }

    return (
        <div style={S.budgetList}>
            {stat.map(c => (
                <div key={c.id} style={S.budgetItem}>
                    <div style={{ ...S.budgetIcon, background: `${c.colore}22` }} aria-hidden="true">
                        {c.icona}
                    </div>
                    <div style={S.budgetMid}>
                        <div style={S.budgetTitle}>{c.nome}</div>
                        <div style={S.budgetBar}>
                            <div style={{
                                ...S.budgetFill,
                                width: `${c.pct}%`,
                                background: c.pct >= 100
                                    ? 'var(--accent)'
                                    : c.pct >= 80
                                        ? 'var(--warning)'
                                        : c.colore,
                            }} />
                        </div>
                    </div>
                    <div style={S.budgetAmt} className="num">
                        {formatEUR(c.speso)}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> / {formatEUR(c.budget_mensile)}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

const S = {
    budgetList: {
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
    },
    budgetItem: {
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto',
        gap: 14,
        alignItems: 'center',
        padding: '14px 18px',
        borderBottom: '1px solid var(--line)',
    },
    budgetIcon: {
        width: 40, height: 40,
        borderRadius: 12,
        display: 'grid',
        placeItems: 'center',
        fontSize: 18,
    },
    budgetMid: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 },
    budgetTitle: { fontSize: 14, fontWeight: 600 },
    budgetBar: { height: 5, background: 'var(--bg-2)', borderRadius: 999, overflow: 'hidden' },
    budgetFill: { height: '100%', borderRadius: 999, transition: 'width .3s' },
    budgetAmt: { fontSize: 13, fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' },
    emptyBudget: {
        padding: '16px 18px',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-muted)',
        fontSize: 13.5,
        textAlign: 'center',
    },
    linkInline: { color: 'var(--accent)', fontWeight: 600 },
}
