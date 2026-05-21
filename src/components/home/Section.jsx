export default function Section({ title, right, children }) {
    return (
        <div style={S.section}>
            <SectionHead title={title} right={right} />
            {children}
        </div>
    )
}

export function SectionHead({ title, right }) {
    return (
        <div style={S.sectionHead}>
            <h2 style={S.h2}>{title}</h2>
            {right}
        </div>
    )
}

const S = {
    section: { marginBottom: 28 },
    sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, gap: 12, flexWrap: 'wrap' },
    h2: {
        margin: 0,
        fontFamily: 'var(--font-serif)',
        fontSize: 22,
        fontWeight: 500,
        letterSpacing: '-0.02em',
    },
}
