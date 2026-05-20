import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { formatEUR } from '../utils/format'

export default function GraficoSpese({ transazioni }) {
    const [activeId, setActiveId] = useState(null)

    const dati = useMemo(() => {
        const map = new Map()
        for (const t of transazioni) {
            if (t.tipo !== 'spesa') continue
            const key = t.categoria_id ?? 'nessuna'
            const cur = map.get(key) ?? {
                id: key,
                nome: t.categoria?.nome ?? 'Senza categoria',
                colore: t.categoria?.colore ?? '#a78bfa',
                icona: t.categoria?.icona ?? '📄',
                totale: 0,
                count: 0,
            }
            cur.totale += Number(t.importo)
            cur.count += 1
            map.set(key, cur)
        }
        return Array.from(map.values()).sort((a, b) => b.totale - a.totale)
    }, [transazioni])

    const totaleComplessivo = dati.reduce((s, d) => s + d.totale, 0)

    if (dati.length === 0) {
        return (
            <div style={S.card}>
                <div style={S.head}>
                    <h2 style={S.h2}>Spese per categoria</h2>
                </div>
                <div style={S.empty}>
                    <div style={S.emptyIcon} aria-hidden="true">📈</div>
                    <div style={S.emptyMsg}>Nessuna spesa in questo mese</div>
                </div>
            </div>
        )
    }

    const active = activeId != null ? dati.find(d => d.id === activeId) : null
    const togglePin = (id) => setActiveId(prev => prev === id ? null : id)

    return (
        <div style={S.card}>
            <div style={S.head}>
                <h2 style={S.h2}>Spese per categoria</h2>
                <span style={S.totale} className="num">{formatEUR(totaleComplessivo)}</span>
            </div>

            <div style={S.grid} className="chart-grid">
                <div style={S.chartWrap}>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={dati}
                                dataKey="totale"
                                nameKey="nome"
                                cx="50%" cy="50%"
                                innerRadius={68}
                                outerRadius={104}
                                paddingAngle={2}
                                stroke="none"
                                onMouseEnter={(d) => setActiveId(d?.id)}
                                onMouseLeave={() => setActiveId(null)}
                                onClick={(d) => togglePin(d?.id)}
                            >
                                {dati.map((d) => (
                                    <Cell
                                        key={d.id}
                                        fill={d.colore}
                                        opacity={activeId == null || activeId === d.id ? 1 : 0.3}
                                        style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    <div style={S.donutCenter}>
                        {active ? (
                            <>
                                <div style={S.donutEmoji} aria-hidden="true">{active.icona}</div>
                                <div style={S.donutNome} title={active.nome}>{active.nome}</div>
                                <div style={S.donutValue} className="num">{formatEUR(active.totale)}</div>
                                <div style={S.donutSub} className="num">
                                    {((active.totale / totaleComplessivo) * 100).toFixed(1)}% · {active.count} mov.
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={S.donutLabel}>Totale</div>
                                <div style={S.donutValue} className="num">{formatEUR(totaleComplessivo)}</div>
                            </>
                        )}
                    </div>
                </div>

                <ul style={S.legend}>
                    {dati.map(d => {
                        const pct = (d.totale / totaleComplessivo) * 100
                        const isActive = activeId === d.id
                        return (
                            <li
                                key={d.id}
                                style={{
                                    ...S.legendItem,
                                    borderColor: isActive ? d.colore : 'var(--line)',
                                    background: isActive ? `${d.colore}11` : 'var(--bg-2)',
                                }}
                                onMouseEnter={() => setActiveId(d.id)}
                                onMouseLeave={() => setActiveId(null)}
                                onClick={() => togglePin(d.id)}
                            >
                                <div style={S.legendLeft}>
                                    <span style={{ ...S.legendDot, background: d.colore }} aria-hidden="true" />
                                    <span style={S.legendIcon} aria-hidden="true">{d.icona}</span>
                                    <span style={S.legendNome}>{d.nome}</span>
                                </div>
                                <div style={S.legendRight}>
                                    <div style={S.legendVal} className="num">{formatEUR(d.totale)}</div>
                                    <div style={S.legendPct} className="num">{pct.toFixed(1)}%</div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}

const S = {
    card: {
        background: 'var(--surface)',
        padding: 22,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
    },
    head: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 },
    h2: {
        margin: 0,
        fontSize: 17,
        fontFamily: 'var(--font-serif)',
        fontWeight: 500,
        letterSpacing: '-0.01em',
    },
    totale: { fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
        gap: 18,
        alignItems: 'center',
    },
    chartWrap: { position: 'relative', minWidth: 0, width: '100%' },
    donutCenter: {
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none',
        width: 124,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
    },
    donutLabel: {
        color: 'var(--text-muted)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontWeight: 700,
    },
    donutEmoji: { fontSize: 20, lineHeight: 1, marginBottom: 2 },
    donutNome: {
        fontSize: 11,
        color: 'var(--text-muted)',
        fontWeight: 600,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
    },
    donutValue: {
        color: 'var(--text)',
        fontSize: 17,
        fontWeight: 800,
        marginTop: 2,
    },
    donutSub: {
        color: 'var(--text-muted)',
        fontSize: 10.5,
        fontWeight: 600,
        marginTop: 2,
    },
    legend: {
        listStyle: 'none',
        padding: 0, margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        maxHeight: 260,
        overflowY: 'auto',
        minWidth: 0,
    },
    legendItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid',
        transition: 'border-color 0.15s, background 0.15s',
        cursor: 'pointer',
        minWidth: 0,
    },
    legendLeft: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 },
    legendDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
    legendIcon: { fontSize: 14, flexShrink: 0 },
    legendNome: {
        fontSize: 13,
        color: 'var(--text)',
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
    },
    legendRight: { textAlign: 'right', flexShrink: 0, marginLeft: 12 },
    legendVal: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
    legendPct: { fontSize: 11, color: 'var(--text-muted)', marginTop: 1 },
    empty: { textAlign: 'center', padding: '20px 0' },
    emptyIcon: { fontSize: 36, opacity: 0.5, marginBottom: 8 },
    emptyMsg: { color: 'var(--text-muted)', fontSize: 14 },
}
