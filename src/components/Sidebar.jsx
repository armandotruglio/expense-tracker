import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV = [
    { to: '/', label: 'Panoramica', icon: '▤' },
    { to: '/categorie', label: 'Categorie', icon: '⊞' },
    { to: '/ricorrenti', label: 'Ricorrenti', icon: '⟳' },
]

export default function Sidebar() {
    const { user, signOut } = useAuth()
    const location = useLocation()

    const iniziali = (user?.email ?? '?').slice(0, 2).toUpperCase()

    return (
        <aside style={S.aside}>
            <div style={S.brand}>
                <span style={S.brandMark}>€</span>
                <span style={S.brandName}>Spese</span>
            </div>

            <div>
                <div style={S.navLabel}>Workspace</div>
                <nav style={S.nav}>
                    {NAV.map(item => {
                        const active = location.pathname === item.to
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                style={{
                                    ...S.navItem,
                                    ...(active ? S.navItemActive : null),
                                }}
                                className="ix-btn-ghost"
                            >
                                <span style={S.navIcon} aria-hidden="true">{item.icon}</span>
                                {item.label}
                            </NavLink>
                        )
                    })}
                </nav>
            </div>

            <div style={S.userBox}>
                <div style={S.avatar}>{iniziali}</div>
                <div style={S.userInfo}>
                    <b style={S.userName}>{user?.email?.split('@')[0] ?? 'Utente'}</b>
                    <span style={S.userMail}>{user?.email}</span>
                </div>
                <button
                    onClick={signOut}
                    style={S.signOut}
                    className="ix-btn-icon"
                    aria-label="Esci"
                    title="Esci"
                >
                    ⎋
                </button>
            </div>
        </aside>
    )
}

const S = {
    aside: {
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        position: 'sticky',
        top: 0,
        height: '100vh',
        padding: '28px 22px',
        borderRight: '1px solid var(--line)',
        background: 'var(--surface)',
    },
    brand: { display: 'flex', alignItems: 'baseline', gap: 10 },
    brandMark: {
        fontFamily: 'var(--font-serif)',
        fontSize: 30,
        fontWeight: 500,
        color: 'var(--accent)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
    },
    brandName: {
        fontFamily: 'var(--font-serif)',
        fontSize: 20,
        fontWeight: 500,
        letterSpacing: '-0.01em',
    },
    navLabel: {
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-subtle)',
        fontWeight: 700,
        padding: '0 12px',
        marginBottom: 8,
    },
    nav: { display: 'flex', flexDirection: 'column', gap: 2 },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-muted)',
        fontSize: 14,
        fontWeight: 500,
        textDecoration: 'none',
        background: 'transparent',
        border: 'none',
    },
    navItemActive: {
        background: 'var(--rose-soft)',
        color: 'var(--accent)',
        fontWeight: 600,
    },
    navIcon: { width: 18, textAlign: 'center', opacity: 0.8 },
    userBox: {
        marginTop: 'auto',
        paddingTop: 18,
        borderTop: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'var(--grad-purple)',
        color: 'white',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
    },
    userInfo: { minWidth: 0, flex: 1, lineHeight: 1.3 },
    userName: { display: 'block', fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    userMail: { fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' },
    signOut: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-muted)',
        fontSize: 18,
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-sm)',
        display: 'grid',
        placeItems: 'center',
        opacity: 0.7,
        flexShrink: 0,
    },
}
