import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import TabBar from './TabBar'

const MOBILE_QUERY = '(max-width: 959px)'

export default function Layout({ children, onAddClick }) {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false
    )

    useEffect(() => {
        const mq = window.matchMedia(MOBILE_QUERY)
        const handler = (e) => setIsMobile(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    return (
        <div style={isMobile ? S.shellMobile : S.shellDesktop}>
            {!isMobile && <Sidebar />}
            <main style={isMobile ? S.mainMobile : S.mainDesktop}>
                {children}
            </main>
            {isMobile && <TabBar onAddClick={onAddClick} />}
        </div>
    )
}

const S = {
    shellMobile: { minHeight: '100vh', paddingBottom: 90 },
    shellDesktop: {
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
    },
    mainMobile: {
        width: '100%',
        maxWidth: 520,
        margin: '0 auto',
        padding: `${'calc(var(--safe-top) + 8px)'} 0 0`,
    },
    mainDesktop: {
        width: '100%',
        maxWidth: 1280,
        padding: '32px 40px 60px',
        margin: '0 auto',
    },
}
