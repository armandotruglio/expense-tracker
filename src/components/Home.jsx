import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCategorie } from '../hooks/useCategorie'
import { useTransazioni } from '../hooks/useTransazioni'
import {
    formatEUR, formatData,
    meseISO, intervalloMese, meseLabel,
} from '../utils/format'
import { statsMese } from '../utils/stats'
import { generaInsights } from '../utils/insights'
import { transazioniToCSV, downloadCSV } from '../utils/csv'

import GraficoSpese from './GraficoSpese'
import FiltriTransazioni from './FiltriTransazioni'
import Modal from './Modal'
import ConfirmDialog from './ConfirmDialog'
import Collapsible from './Collapsible'
import TransazioneForm from './TransazioneForm'
import WeekChart from './WeekChart'
import InsightCard from './InsightCard'
import { useToast } from '../hooks/useToast'

import Hero from './home/Hero'
import MonthPicker from './home/MonthPicker'
import Kpi, { KpiRow, MStat, MStatRow } from './home/Kpi'
import BudgetSummary from './home/BudgetSummary'
import BudgetList from './home/BudgetList'
import TxList from './home/TxList'
import Section, { SectionHead } from './home/Section'

const FILTRI_INIZIALI = {
    search: '', tipo: 'tutti', categorieSel: [],
    importoMin: '', importoMax: '', dataDa: '', dataA: '', ordine: 'data_desc',
}

const MQ_DESKTOP = '(min-width: 960px)'

export default function Home({ openCreateTrigger = 0, onCreateConsumed }) {
    const { user } = useAuth()
    const { categorie, loading: catLoading } = useCategorie()
    const toast = useToast()

    const [mese, setMese] = useState(meseISO())
    const { from, to } = useMemo(() => intervalloMese(mese), [mese])
    const { transazioni, loading: txLoading, aggiungi, modifica, elimina } =
        useTransazioni({ from, to })

    // Mese precedente per insight e trend saldo
    const mesePrecRange = useMemo(() => {
        const [y, m] = mese.split('-').map(Number)
        const pm = m === 1 ? 12 : m - 1
        const py = m === 1 ? y - 1 : y
        return intervalloMese(`${py}-${String(pm).padStart(2, '0')}`)
    }, [mese])
    const { transazioni: txPrec } = useTransazioni(mesePrecRange)

    const [modal, setModal] = useState(null)
    const [toDelete, setToDelete] = useState(null)
    const [filtri, setFiltri] = useState(FILTRI_INIZIALI)
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(MQ_DESKTOP).matches : true
    )

    useEffect(() => {
        const mq = window.matchMedia(MQ_DESKTOP)
        const h = (e) => setIsDesktop(e.matches)
        mq.addEventListener('change', h)
        return () => mq.removeEventListener('change', h)
    }, [])

    // Apertura nuova transazione triggerata dal FAB del TabBar.
    // Il parent reset-ta il trigger appena consumato, così un eventuale
    // ri-montaggio di Home (es. tornando alla home da un'altra rotta) non
    // riapre la modale.
    useEffect(() => {
        if (openCreateTrigger <= 0) return
        let cancelled = false
        Promise.resolve().then(() => {
            if (cancelled) return
            setModal({ mode: 'create' })
            onCreateConsumed?.()
        })
        return () => { cancelled = true }
    }, [openCreateTrigger, onCreateConsumed])

    // Stats aggregate del mese (usate da hero, KPI, BudgetSummary, BudgetList, insights)
    const stats = useMemo(() => statsMese(transazioni, categorie), [transazioni, categorie])
    const statsPrec = useMemo(() => statsMese(txPrec, categorie), [txPrec, categorie])

    const trendSaldo = statsPrec.saldo !== 0
        ? ((stats.saldo - statsPrec.saldo) / Math.abs(statsPrec.saldo)) * 100
        : null

    const insights = useMemo(
        () => generaInsights({ statsMese: stats, statsMesePrec: statsPrec, categorie }),
        [stats, statsPrec, categorie]
    )

    // Media giornaliera (dipende dal mese corrente)
    const { giorniTrascorsi, mediaGior } = useMemo(() => {
        const oggi = new Date()
        const [yM, mM] = mese.split('-').map(Number)
        const giorni = (oggi.getFullYear() === yM && oggi.getMonth() + 1 === mM)
            ? oggi.getDate()
            : new Date(yM, mM, 0).getDate()
        return {
            giorniTrascorsi: giorni,
            mediaGior: giorni > 0 ? stats.totSpese / giorni : 0,
        }
    }, [mese, stats.totSpese])

    async function handleFormSubmit(payload) {
        if (modal?.mode === 'edit') await modifica(modal.tx.id, payload)
        else await aggiungi(payload)
        setModal(null)
    }

    async function handleConfirmDelete() {
        if (!toDelete) return
        try {
            await elimina(toDelete.id)
            setToDelete(null)
        } catch (err) {
            toast.error(err?.message ?? 'Errore durante l\'eliminazione')
            setToDelete(null)
        }
    }

    const resetFiltri = () => setFiltri(FILTRI_INIZIALI)

    const nFiltriAttivi = useMemo(() => {
        let n = 0
        if (filtri.search.trim()) n++
        if (filtri.tipo !== 'tutti') n++
        n += filtri.categorieSel.length
        if (filtri.importoMin !== '') n++
        if (filtri.importoMax !== '') n++
        if (filtri.dataDa) n++
        if (filtri.dataA) n++
        return n
    }, [filtri])

    const transazioniFiltrate = useMemo(() => {
        let out = [...transazioni]
        if (filtri.search.trim()) {
            const q = filtri.search.trim().toLowerCase()
            out = out.filter(t =>
                (t.descrizione ?? '').toLowerCase().includes(q) ||
                (t.categoria?.nome ?? '').toLowerCase().includes(q))
        }
        if (filtri.tipo !== 'tutti') out = out.filter(t => t.tipo === filtri.tipo)
        if (filtri.categorieSel.length > 0) out = out.filter(t => filtri.categorieSel.includes(t.categoria_id))
        if (filtri.importoMin !== '') { const m = parseFloat(filtri.importoMin); out = out.filter(t => Number(t.importo) >= m) }
        if (filtri.importoMax !== '') { const m = parseFloat(filtri.importoMax); out = out.filter(t => Number(t.importo) <= m) }
        if (filtri.dataDa) out = out.filter(t => t.data >= filtri.dataDa)
        if (filtri.dataA) out = out.filter(t => t.data <= filtri.dataA)
        out.sort((a, b) => {
            switch (filtri.ordine) {
                case 'data_asc': return a.data.localeCompare(b.data)
                case 'importo_desc': return Number(b.importo) - Number(a.importo)
                case 'importo_asc': return Number(a.importo) - Number(b.importo)
                case 'categoria': return (a.categoria?.nome ?? '').localeCompare(b.categoria?.nome ?? '')
                default: return b.data.localeCompare(a.data)
            }
        })
        return out
    }, [transazioni, filtri])

    const oggi = meseISO()
    const isMeseCorrente = mese === oggi

    function handleExport() {
        try {
            const csv = transazioniToCSV(transazioniFiltrate)
            downloadCSV(`transazioni-${mese}.csv`, csv)
        } catch (err) {
            toast.error(err?.message ?? 'Export fallito')
        }
    }

    const userName = user?.email?.split('@')[0] ?? 'Utente'
    const { totSpese, totEntrate, saldo, topCategoria, budget } = stats

    return (
        <div style={S.app}>
            {/* HEADER */}
            {isDesktop ? (
                <div style={S.topbar}>
                    <div style={{ lineHeight: 1.1 }}>
                        <div style={S.ciao}>Ciao {userName}!</div>
                        <h1 style={S.h1}>Panoramica · {meseLabel(mese)}</h1>
                    </div>
                    <div style={S.topbarRight}>
                        <MonthPicker mese={mese} setMese={setMese} oggi={oggi} isMeseCorrente={isMeseCorrente} />
                        <button onClick={handleExport} style={S.btnGhost} className="ix-btn-ghost">
                            ⤓ Esporta
                        </button>
                        <button onClick={() => setModal({ mode: 'create' })} style={S.btnPrimary} className="ix-btn-primary">
                            + Nuova transazione
                        </button>
                    </div>
                </div>
            ) : (
                <div style={S.mHeader}>
                    <div style={{ minWidth: 0 }}>
                        <div style={S.ciaoMobile}>Ciao!</div>
                        <div style={S.nameMobile}>{userName} 👋</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handleExport} style={S.iconBtnSurf} className="ix-btn-icon" aria-label="Esporta CSV">⤓</button>
                    </div>
                </div>
            )}

            <Hero
                saldo={saldo}
                totEntrate={totEntrate}
                totSpese={totSpese}
                trend={trendSaldo}
                isDesktop={isDesktop}
            />

            {!isDesktop && (
                <div style={{ padding: '0 18px', marginBottom: 24 }}>
                    <MonthPicker mese={mese} setMese={setMese} oggi={oggi} isMeseCorrente={isMeseCorrente} mobile />
                </div>
            )}

            {isDesktop ? (
                <KpiRow>
                    <Kpi
                        label="Budget"
                        value={budget.totale > 0 ? `${budget.pct.toFixed(0)}%` : '—'}
                        sub={budget.totale > 0 ? `${formatEUR(budget.restante)} disponibili` : 'Nessun budget'}
                    />
                    <Kpi
                        label="Transazioni"
                        value={`${transazioni.length}`}
                        sub={`${transazioniFiltrate.length} filtrate`}
                    />
                    <Kpi
                        label="Top categoria"
                        value={topCategoria ? `${topCategoria.icona} ${topCategoria.nome}` : '—'}
                        sub={topCategoria ? formatEUR(topCategoria.totale) : 'Nessuna spesa'}
                    />
                    <Kpi
                        label="Media giornaliera"
                        value={formatEUR(mediaGior)}
                        sub={isMeseCorrente ? `su ${giorniTrascorsi} giorni` : 'mese completo'}
                    />
                </KpiRow>
            ) : (
                <MStatRow>
                    <MStat label="Entrate" value={formatEUR(totEntrate)} color="var(--success)" />
                    <MStat label="Spese" value={formatEUR(totSpese)} color="var(--accent)" />
                </MStatRow>
            )}

            <BudgetSummary totSpese={totSpese} budgetTotale={budget.totale} pct={budget.pct} />

            {isDesktop ? (
                <div style={S.grid2}>
                    <div>
                        <Section title="Andamento settimana">
                            <WeekChart transazioni={transazioni} />
                        </Section>

                        <Section
                            title="Movimenti recenti"
                            right={nFiltriAttivi > 0
                                ? <button onClick={resetFiltri} style={S.clearLink}>Azzera filtri</button>
                                : null}
                        >
                            <Collapsible title="🔎 Filtri" badge={nFiltriAttivi}>
                                <FiltriTransazioni
                                    categorie={categorie}
                                    filtri={filtri}
                                    setFiltri={setFiltri}
                                    onReset={resetFiltri}
                                />
                            </Collapsible>
                            <TxList
                                transazioni={transazioniFiltrate}
                                totaleNonFiltrato={transazioni.length}
                                loading={txLoading}
                                onEdit={(t) => setModal({ mode: 'edit', tx: t })}
                                onDelete={(t) => setToDelete(t)}
                                onAdd={() => setModal({ mode: 'create' })}
                                ordine={filtri.ordine}
                            />
                        </Section>
                    </div>

                    <div>
                        {insights.length > 0 && (
                            <Section title="Insight">
                                <InsightCard insights={insights} variant="desktop" />
                            </Section>
                        )}

                        <Section title="I tuoi budget">
                            <BudgetList categorie={categorie} perCategoria={stats.perCategoria} />
                        </Section>

                        <Section title="Per categoria">
                            <GraficoSpese transazioni={transazioni} />
                        </Section>
                    </div>
                </div>
            ) : (
                <>
                    {insights.length > 0 && (
                        <div style={S.mSection}>
                            <InsightCard insights={insights} variant="mobile" />
                        </div>
                    )}

                    <div style={S.mSection}>
                        <WeekChart transazioni={transazioni} />
                    </div>

                    <div style={S.mSection}>
                        <SectionHead title="I tuoi budget" />
                        <BudgetList categorie={categorie} perCategoria={stats.perCategoria} />
                    </div>

                    <div style={S.mSection}>
                        <SectionHead title="Per categoria" />
                        <GraficoSpese transazioni={transazioni} />
                    </div>

                    <div style={S.mSection}>
                        <SectionHead
                            title="Movimenti"
                            right={nFiltriAttivi > 0 && (
                                <button onClick={resetFiltri} style={S.clearLink}>Azzera</button>
                            )}
                        />
                        <Collapsible title="🔎 Filtri" badge={nFiltriAttivi}>
                            <FiltriTransazioni
                                categorie={categorie}
                                filtri={filtri}
                                setFiltri={setFiltri}
                                onReset={resetFiltri}
                            />
                        </Collapsible>
                        <TxList
                            transazioni={transazioniFiltrate}
                            totaleNonFiltrato={transazioni.length}
                            loading={txLoading}
                            onEdit={(t) => setModal({ mode: 'edit', tx: t })}
                            onDelete={(t) => setToDelete(t)}
                            onAdd={() => setModal({ mode: 'create' })}
                            ordine={filtri.ordine}
                        />
                    </div>
                </>
            )}

            <Modal
                open={modal !== null}
                onClose={() => setModal(null)}
                title={modal?.mode === 'edit' ? '✏️ Modifica transazione' : '+ Nuova transazione'}
            >
                <TransazioneForm
                    key={modal?.mode === 'edit' ? `edit-${modal.tx.id}` : 'create'}
                    categorie={categorie}
                    catLoading={catLoading}
                    iniziale={modal?.mode === 'edit' ? modal.tx : null}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setModal(null)}
                />
            </Modal>

            <ConfirmDialog
                open={toDelete !== null}
                title="Eliminare transazione?"
                message={toDelete
                    ? `Stai per eliminare:\n"${toDelete.descrizione || toDelete.categoria?.nome || 'transazione'}" da ${formatData(toDelete.data)}.\n\nL'operazione non può essere annullata.`
                    : ''}
                confirmLabel="Elimina"
                danger
                onConfirm={handleConfirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </div>
    )
}

const S = {
    app: { padding: 0 },

    topbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
        flexWrap: 'wrap',
        gap: 16,
    },
    ciao: {
        fontFamily: 'var(--font-hand)',
        fontSize: 22,
        color: 'var(--lavender)',
        fontWeight: 600,
        lineHeight: 1,
    },
    h1: {
        fontFamily: 'var(--font-serif)',
        fontSize: 30,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        margin: '4px 0 0',
        color: 'var(--text)',
    },
    topbarRight: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
    btnPrimary: {
        padding: '10px 18px',
        background: 'var(--grad-hero)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        fontSize: 13,
        fontWeight: 700,
        boxShadow: 'var(--shadow-coral)',
    },
    btnGhost: {
        padding: '10px 16px',
        background: 'var(--surface)',
        color: 'var(--text-2)',
        border: '1px solid var(--line-2)',
        borderRadius: 'var(--radius-md)',
        fontSize: 13,
        fontWeight: 600,
        boxShadow: 'var(--shadow-sm)',
    },

    mHeader: {
        padding: '20px 22px 8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    ciaoMobile: {
        fontFamily: 'var(--font-hand)',
        fontSize: 18,
        color: 'var(--lavender)',
        fontWeight: 600,
        lineHeight: 1,
    },
    nameMobile: {
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        marginTop: 2,
    },
    iconBtnSurf: {
        width: 40,
        height: 40,
        borderRadius: 14,
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 16,
        boxShadow: 'var(--shadow-sm)',
    },

    grid2: { display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 28 },
    mSection: { padding: '0 18px', marginBottom: 24 },
    clearLink: {
        background: 'transparent',
        border: 'none',
        color: 'var(--accent)',
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'underline',
        padding: 0,
    },
}
