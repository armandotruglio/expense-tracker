import { NavLink, useLocation } from 'react-router-dom'

const TABS_LEFT = [
    { to: '/', label: 'Home', icon: '🏠' },
    { to: '/ricorrenti', label: 'Ricorrenti', icon: '⟳' },
]

const TABS_RIGHT = [
    { to: '/categorie', label: 'Categorie', icon: '🏷️' },
    { to: '/impostazioni', label: 'Profilo', icon: '👤' },
]

export default function TabBar({ onAddClick }) {
    const location = useLocation()

    return (
        <nav style={S.tabbar} aria-label="Navigazione principale">
            {TABS_LEFT.map(t => <Tab key={t.to} {...t} active={location.pathname === t.to} />)}
            <button
                onClick={onAddClick}
                style={S.fab}
                className="ix-fab"
                aria-label="Aggiungi transazione"
            >
                <span aria-hidden="true">+</span>
            </button>
            {TABS_RIGHT.map(t => <Tab key={t.to} {...t} active={location.pathname === t.to} />)}
        </nav>
    )
}

function Tab({ to, label, icon, active }) {
    return (
        <NavLink
            to={to}
            style={{ ...S.tab, ...(active ? S.tabActive : null) }}
            aria-label={label}
        >
            <span style={S.tabIcon} aria-hidden="true">{icon}</span>
            <span style={S.tabLabel}>{label}</span>
        </NavLink>
    )
}

const S = {
    tabbar: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--line)',
        padding: `10px 18px calc(10px + var(--safe-bottom))`,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -10px 30px rgba(40, 20, 60, 0.05)',
        zIndex: 100,
    },
    tab: {
        flex: 1,
        textAlign: 'center',
        padding: '6px 0',
        textDecoration: 'none',
        color: 'var(--text-muted)',
        fontSize: 10.5,
        fontWeight: 600,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
    },
    tabActive: { color: 'var(--accent)' },
    tabIcon: { fontSize: 20, lineHeight: 1 },
    tabLabel: { fontSize: 10.5 },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 22,
        background: 'var(--grad-hero)',
        display: 'grid',
        placeItems: 'center',
        color: 'white',
        fontSize: 28,
        boxShadow: 'var(--shadow-coral)',
        marginTop: -28,
        flexShrink: 0,
        border: '4px solid var(--surface)',
        lineHeight: 1,
    },
}
