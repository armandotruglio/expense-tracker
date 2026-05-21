import { useMemo } from 'react'
import { formatEUR } from '../../utils/format'
import SkeletonList from './SkeletonList'
import EmptyState from './EmptyState'

export default function TxList({
    transazioni,
    totaleNonFiltrato,
    loading,
    onEdit,
    onDelete,
    onAdd,
    ordine,
}) {
    const groupByDay = ordine === 'data_desc' || ordine === 'data_asc'

    const gruppi = useMemo(() => {
        if (!groupByDay) return null
        const map = new Map()
        for (const t of transazioni) {
            if (!map.has(t.data)) map.set(t.data, [])
            map.get(t.data).push(t)
        }
        return Array.from(map.entries())
    }, [transazioni, groupByDay])

    if (loading) return <SkeletonList />

    if (transazioni.length === 0) {
        return (
            <EmptyState
                title={totaleNonFiltrato === 0 ? 'Nessuna transazione' : 'Nessun risultato'}
                message={totaleNonFiltrato === 0
                    ? 'Inizia ad aggiungere le tue transazioni del mese.'
                    : 'Nessuna transazione corrisponde ai filtri.'}
                action={totaleNonFiltrato === 0
                    ? { label: '+ Aggiungi la prima', onClick: onAdd }
                    : null}
            />
        )
    }

    if (groupByDay && gruppi) {
        return (
            <div style={S.groups}>
                {gruppi.map(([giorno, txs], gi) => {
                    const totGiorno = txs.reduce(
                        (s, t) => s + (t.tipo === 'spesa' ? -1 : 1) * Number(t.importo), 0
                    )
                    return (
                        <div key={giorno} style={S.dayBlock}>
                            <div style={S.dayHead}>
                                <span style={S.dayLabel}>{labelGiorno(giorno)}</span>
                                <span style={{
                                    ...S.dayTotal,
                                    color: totGiorno >= 0 ? 'var(--success)' : 'var(--accent)',
                                }} className="num">
                                    {totGiorno >= 0 ? '+' : '−'}{formatEUR(Math.abs(totGiorno))}
                                </span>
                            </div>
                            <div style={S.txList}>
                                {txs.map((t, i) => (
                                    <TxRow
                                        key={t.id}
                                        t={t}
                                        onEdit={() => onEdit(t)}
                                        onDelete={() => onDelete(t)}
                                        delay={gi * 3 + i}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div style={S.txList}>
            {transazioni.map((t, i) => (
                <TxRow
                    key={t.id}
                    t={t}
                    onEdit={() => onEdit(t)}
                    onDelete={() => onDelete(t)}
                    delay={i}
                />
            ))}
        </div>
    )
}

function TxRow({ t, onEdit, onDelete, delay = 0 }) {
    const colorIcon = t.categoria?.colore ?? '#a78bfa'
    return (
        <div
            style={{ ...S.tx, animationDelay: `${Math.min(delay, 10) * 25}ms` }}
            className="ix-item list-enter"
        >
            <div style={{ ...S.txEmoji, background: `${colorIcon}22` }} aria-hidden="true">
                {t.categoria?.icona ?? '📄'}
            </div>
            <div style={S.txBody}>
                <div style={S.txTitle}>{t.descrizione || t.categoria?.nome || '(senza descrizione)'}</div>
                <div style={S.txSub}>{t.categoria?.nome ?? 'senza categoria'}</div>
            </div>
            <div style={S.txRight}>
                <div style={{
                    ...S.txAmt,
                    color: t.tipo === 'spesa' ? 'var(--accent)' : 'var(--success)',
                }} className="num">
                    {t.tipo === 'spesa' ? '−' : '+'}{formatEUR(t.importo)}
                </div>
                <button onClick={onEdit} style={S.txBtn} className="ix-btn-icon" aria-label="Modifica transazione">✏️</button>
                <button onClick={onDelete} style={S.txBtn} className="ix-btn-icon" aria-label="Elimina transazione">🗑️</button>
            </div>
        </div>
    )
}

function labelGiorno(iso) {
    const [y, m, d] = iso.split('-').map(Number)
    const data = new Date(y, m - 1, d)
    const oggi = new Date(); oggi.setHours(0, 0, 0, 0)
    const ieri = new Date(oggi); ieri.setDate(ieri.getDate() - 1)
    const dataMid = new Date(data); dataMid.setHours(0, 0, 0, 0)
    if (dataMid.getTime() === oggi.getTime()) return 'Oggi'
    if (dataMid.getTime() === ieri.getTime()) return 'Ieri'
    return data.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' })
}

const S = {
    txList: {
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
    },
    groups: { display: 'flex', flexDirection: 'column', gap: 18 },
    dayBlock: {},
    dayHead: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 4px',
        marginBottom: 4,
    },
    dayLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.10em',
        color: 'var(--text-muted)',
        fontWeight: 700,
    },
    dayTotal: { fontSize: 12, fontWeight: 700 },
    tx: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
    },
    txEmoji: {
        width: 40, height: 40,
        borderRadius: 12,
        display: 'grid',
        placeItems: 'center',
        fontSize: 18,
        flexShrink: 0,
    },
    txBody: { flex: 1, minWidth: 0 },
    txTitle: { fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    txSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
    txRight: { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 },
    txAmt: { fontSize: 14, fontWeight: 700, marginRight: 4 },
    txBtn: {
        background: 'transparent',
        border: 'none',
        width: 32, height: 32,
        borderRadius: 'var(--radius-sm)',
        fontSize: 15,
        opacity: 0.7,
        display: 'grid',
        placeItems: 'center',
    },
}
