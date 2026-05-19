import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatEUR } from '../utils/format'

export default function GraficoSpese({ transazioni, categorie }) {
    // aggrega le spese per categoria
    const dati = useMemo(() => {
        const map = new Map()
        for (const t of transazioni) {
            if (t.tipo !== 'spesa') continue
            const key = t.categoria_id ?? 'nessuna'
            const cur = map.get(key) ?? {
                id: key,
                nome: t.categoria?.nome ?? 'Senza categoria',
                colore: t.categoria?.colore ?? '#94a3b8',
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
            <section style={S.section}>
                <h2 style={S.h2}>📊 Spese per categoria</h2>
                <p style={S.muted}>Nessuna spesa in questo mese</p>
            </section>
        )
    }

    return (
        <section style={S.section}>
            <div style={S.sectionHead}>
                <h2 style={S.h2}>📊 Spese per categoria</h2>
                <span style={S.totale}>{formatEUR(totaleComplessivo)}</span>
            </div>

            <div style={S.grid} className="grid-chart">
                {/* DONUT */}
                <div style={S.chartWrap}>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={dati}
                                dataKey="totale"
                                nameKey="nome"
                                cx="50%" cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={2}
                                stroke="none"
                            >
                                {dati.map((d) => (
                                    <Cell key={d.id} fill={d.colore} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip totale={totaleComplessivo} />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* totale al centro della donut */}
                    <div style={S.donutCenter}>
                        <div style={S.donutLabel}>Totale</div>
                        <div style={S.donutValue}>{formatEUR(totaleComplessivo)}</div>
                    </div>
                </div>

                {/* LEGENDA */}
                <ul style={S.legend}>
                    {dati.map(d => {
                        const pct = (d.totale / totaleComplessivo) * 100
                        return (
                            <li key={d.id} style={S.legendItem}>
                                <div style={S.legendLeft}>
                                    <span style={{ ...S.legendDot, background: d.colore }} />
                                    <span style={S.legendIcon}>{d.icona}</span>
                                    <span style={S.legendNome}>{d.nome}</span>
                                </div>
                                <div style={S.legendRight}>
                                    <div style={S.legendVal}>{formatEUR(d.totale)}</div>
                                    <div style={S.legendPct}>{pct.toFixed(1)}%</div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </section>
    )
}

function CustomTooltip({ active, payload, totale }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    const pct = (d.totale / totale) * 100
    return (
        <div style={S.tooltip}>
            <div style={S.tooltipHead}>
                <span style={{ fontSize: 18 }}>{d.icona}</span>
                <strong>{d.nome}</strong>
            </div>
            <div style={S.tooltipVal}>{formatEUR(d.totale)} · {pct.toFixed(1)}%</div>
            <div style={S.tooltipSub}>{d.count} {d.count === 1 ? 'movimento' : 'movimenti'}</div>
        </div>
    )
}

const S = {
    section: { background: '#1e1e2f', padding: 24, borderRadius: 14, border: '1px solid rgba(255,255,255,.05)', marginBottom: 24 },
    sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    h2: { margin: 0, fontSize: 18 },
    totale: { fontSize: 14, color: '#a0a0a0', fontWeight: 500 },
    grid: { display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(280px, 1.2fr)', gap: 24, alignItems: 'center' },
    chartWrap: { position: 'relative', minWidth: 240 },
    donutCenter: {
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none',
    },
    donutLabel: { color: '#a0a0a0', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
    donutValue: { color: '#e6e6e6', fontSize: 18, fontWeight: 700, marginTop: 4 },
    legend: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' },
    legendItem: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 10px', background: '#0f0f1e', borderRadius: 8,
        border: '1px solid rgba(255,255,255,.04)',
    },
    legendLeft: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
    legendDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
    legendIcon: { fontSize: 14 },
    legendNome: { fontSize: 13, color: '#e6e6e6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    legendRight: { textAlign: 'right', flexShrink: 0, marginLeft: 12 },
    legendVal: { fontSize: 13, fontWeight: 600, color: '#e6e6e6' },
    legendPct: { fontSize: 11, color: '#a0a0a0', marginTop: 1 },
    muted: { color: '#a0a0a0', fontSize: 14, textAlign: 'center', padding: 20 },
    tooltip: {
        background: '#0f0f1e', border: '1px solid rgba(255,255,255,.1)',
        borderRadius: 10, padding: '10px 12px', minWidth: 180,
        boxShadow: '0 10px 30px rgba(0,0,0,.5)',
    },
    tooltipHead: { display: 'flex', alignItems: 'center', gap: 8, color: '#e6e6e6', fontSize: 13 },
    tooltipVal: { marginTop: 6, color: '#e6e6e6', fontSize: 14, fontWeight: 600 },
    tooltipSub: { marginTop: 2, color: '#a0a0a0', fontSize: 11 },
}