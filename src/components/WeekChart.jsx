import { useMemo } from 'react'
import { formatEUR } from '../utils/format'

const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

export default function WeekChart({ transazioni }) {
    const { settimana, totale, trend } = useMemo(() => calcola(transazioni), [transazioni])

    const max = Math.max(...settimana.map(d => d.totale), 1)

    return (
        <div style={S.card}>
            <div style={S.head}>
                <div>
                    <div style={S.titolo}>Spese di questa settimana</div>
                    <div style={S.totRow}>
                        <span style={S.totale} className="num">{formatEUR(totale)}</span>
                        {trend != null && Math.abs(trend) >= 1 && (
                            <span style={{
                                ...S.trend,
                                color: trend < 0 ? 'var(--success)' : 'var(--accent)',
                                background: trend < 0 ? 'var(--success-soft)' : 'var(--accent-soft)',
                            }}>
                                {trend < 0 ? '↓' : '↑'} {Math.abs(trend).toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div style={S.bars}>
                {settimana.map((d, i) => {
                    const h = (d.totale / max) * 100
                    const oggi = d.isToday
                    return (
                        <div key={i} style={S.col} title={`${GIORNI[i]}: ${formatEUR(d.totale)}`}>
                            <div style={S.barTrack}>
                                <div style={{
                                    ...S.barFill,
                                    height: `${Math.max(h, 3)}%`,
                                    background: oggi ? 'var(--grad-hero)' : 'var(--rose-soft)',
                                }} />
                            </div>
                            <div style={{
                                ...S.day,
                                color: oggi ? 'var(--accent)' : 'var(--text-muted)',
                                fontWeight: oggi ? 700 : 600,
                            }}>
                                {GIORNI[i]}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function calcola(transazioni) {
    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)
    // Lunedì di questa settimana
    const giorno = (oggi.getDay() + 6) % 7 // lun=0 ... dom=6
    const lunedi = new Date(oggi)
    lunedi.setDate(oggi.getDate() - giorno)

    const settimana = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(lunedi)
        d.setDate(lunedi.getDate() + i)
        return {
            iso: d.toISOString().slice(0, 10),
            totale: 0,
            isToday: d.getTime() === oggi.getTime(),
        }
    })

    const inizioIso = settimana[0].iso
    const fineIso = settimana[6].iso

    let totale = 0
    for (const t of transazioni) {
        if (t.tipo !== 'spesa') continue
        if (t.data < inizioIso || t.data > fineIso) continue
        const idx = settimana.findIndex(d => d.iso === t.data)
        if (idx >= 0) {
            settimana[idx].totale += Number(t.importo)
            totale += Number(t.importo)
        }
    }

    // Trend vs settimana precedente
    const lunPrec = new Date(lunedi); lunPrec.setDate(lunedi.getDate() - 7)
    const domPrec = new Date(lunedi); domPrec.setDate(lunedi.getDate() - 1)
    const inizioPrecIso = lunPrec.toISOString().slice(0, 10)
    const finePrecIso = domPrec.toISOString().slice(0, 10)
    let totPrec = 0
    for (const t of transazioni) {
        if (t.tipo !== 'spesa') continue
        if (t.data < inizioPrecIso || t.data > finePrecIso) continue
        totPrec += Number(t.importo)
    }
    const trend = totPrec > 0 ? ((totale - totPrec) / totPrec) * 100 : null

    return { settimana, totale, trend }
}

const S = {
    card: {
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 18px 14px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--line)',
    },
    head: { marginBottom: 14 },
    titolo: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 },
    totRow: { display: 'flex', alignItems: 'baseline', gap: 8 },
    totale: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' },
    trend: {
        fontSize: 12,
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 'var(--radius-pill)',
    },
    bars: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 6,
        paddingTop: 4,
    },
    col: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
    },
    barTrack: {
        width: '100%',
        height: 100,
        display: 'flex',
        alignItems: 'flex-end',
    },
    barFill: {
        width: '100%',
        borderRadius: 8,
        transition: 'height 0.25s ease',
    },
    day: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    },
}
