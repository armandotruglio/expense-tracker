import { meseLabel, mesePrec, meseSucc } from '../../utils/format'

export default function MonthPicker({ mese, setMese, oggi, isMeseCorrente, mobile }) {
    return (
        <div style={mobile ? S.monthBarMobile : S.monthBar}>
            <button
                onClick={() => setMese(mesePrec(mese))}
                style={S.monthNav}
                className="ix-btn-ghost"
                aria-label="Mese precedente"
            >‹</button>
            <div style={S.monthCenter}>
                <div style={S.monthLabel}>{meseLabel(mese)}</div>
                {!isMeseCorrente && (
                    <button onClick={() => setMese(oggi)} style={S.monthToday}>Vai a oggi</button>
                )}
            </div>
            <button
                onClick={() => setMese(meseSucc(mese))}
                style={S.monthNav}
                className="ix-btn-ghost"
                aria-label="Mese successivo"
            >›</button>
        </div>
    )
}

const S = {
    monthBar: {
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        padding: 4,
        boxShadow: 'var(--shadow-sm)',
    },
    monthBarMobile: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        padding: '4px 8px',
        boxShadow: 'var(--shadow-sm)',
    },
    monthNav: {
        background: 'transparent',
        border: 'none',
        width: 32, height: 32,
        color: 'var(--text-muted)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 16,
        fontWeight: 600,
    },
    monthCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '0 12px' },
    monthLabel: { fontSize: 13.5, fontWeight: 600, minWidth: 110, textAlign: 'center' },
    monthToday: {
        fontSize: 11,
        color: 'var(--accent)',
        background: 'transparent',
        border: 'none',
        textDecoration: 'underline',
        padding: 0,
        fontWeight: 600,
    },
}
