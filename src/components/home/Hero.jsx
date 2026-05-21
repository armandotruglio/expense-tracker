import { formatEUR } from '../../utils/format'

export default function Hero({ saldo, totEntrate, totSpese, trend, isDesktop }) {
    const trendLabel = trend == null
        ? null
        : `${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(0)}% vs mese scorso`

    const positivo = saldo >= 0

    return (
        <div style={{
            ...S.hero,
            background: positivo ? 'var(--grad-hero)' : 'linear-gradient(135deg, #ff5a6b 0%, #c4577a 60%, #8a6090 100%)',
        }}>
            {!isDesktop && (
                <>
                    <div style={S.heroBlob1} aria-hidden="true" />
                    <div style={S.heroBlob2} aria-hidden="true" />
                </>
            )}
            <div style={S.heroContent}>
                <div style={S.heroLeft}>
                    <div style={S.heroLabel}>Saldo del mese</div>
                    <div style={isDesktop ? S.heroAmountDesk : S.heroAmountMob} className="num">
                        {positivo ? '+' : ''}{formatEUR(saldo)}
                    </div>
                    {trendLabel && (
                        <div style={S.heroSub}>{trendLabel}</div>
                    )}
                </div>
                {isDesktop && (
                    <div style={S.heroRight}>
                        <div style={S.heroStat}>
                            <div style={S.heroStatLbl}>Entrate</div>
                            <div style={S.heroStatVal} className="num">{formatEUR(totEntrate)}</div>
                        </div>
                        <div style={S.heroStat}>
                            <div style={S.heroStatLbl}>Spese</div>
                            <div style={S.heroStatVal} className="num">{formatEUR(totSpese)}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const S = {
    hero: {
        margin: 0,
        padding: '36px 40px',
        borderRadius: 'var(--radius-lg)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 24,
    },
    heroBlob1: {
        position: 'absolute',
        width: 200, height: 200,
        background: 'rgba(255,255,255,0.18)',
        borderRadius: '50%',
        top: -60, right: -60,
    },
    heroBlob2: {
        position: 'absolute',
        width: 120, height: 120,
        background: 'rgba(167,139,250,0.35)',
        borderRadius: '50%',
        bottom: -40, left: -30,
    },
    heroContent: {
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: 20,
    },
    heroLeft: { minWidth: 0 },
    heroLabel: {
        fontSize: 12,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        opacity: 0.9,
        fontWeight: 700,
        marginBottom: 10,
    },
    heroAmountDesk: {
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(48px, 6vw, 76px)',
        fontWeight: 400,
        letterSpacing: '-0.035em',
        margin: 0,
        lineHeight: 0.95,
    },
    heroAmountMob: {
        fontSize: 38,
        fontWeight: 800,
        letterSpacing: '-0.03em',
        margin: '6px 0 4px',
    },
    heroSub: { fontSize: 13, opacity: 0.9, marginTop: 8, fontWeight: 500 },
    heroRight: { display: 'flex', gap: 28, textAlign: 'right' },
    heroStat: {},
    heroStatLbl: { fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 },
    heroStatVal: {
        fontFamily: 'var(--font-serif)',
        fontSize: 26,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        marginTop: 4,
    },
}
