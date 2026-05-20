import { useState, useMemo, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCategorie } from '../hooks/useCategorie'
import { useTransazioni } from '../hooks/useTransazioni'
import {
    formatEUR, formatData,
    meseISO, intervalloMese, meseLabel, mesePrec, meseSucc,
} from '../utils/format'
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

const FILTRI_INIZIALI = {
    search: '', tipo: 'tutti', categorieSel: [],
    importoMin: '', importoMax: '', dataDa: '', dataA: '', ordine: 'data_desc',
}

const MQ_DESKTOP = '(min-width: 960px)'

export default function Home({ openCreateTrigger = 0 }) {
    const { user } = useAuth()
    const { categorie, loading: catLoading } = useCategorie()

    const [mese, setMese] = useState(meseISO())
    const { from, to } = useMemo(() => intervalloMese(mese), [mese])
    const { transazioni, loading: txLoading, aggiungi, modifica, elimina } =
        useTransazioni({ from, to })

    // Mese precedente per insight
    const mesePrecISO = useMemo(() => mesePrec(mese), [mese])
    const { from: fromP, to: toP } = useMemo(() => intervalloMese(mesePrecISO), [mesePrecISO])
    const { transazioni: txPrec } = useTransazioni({ from: fromP, to: toP })

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

    // Apertura nuova transazione triggerata dal FAB del TabBar (mobile)
    const lastTriggerRef = useRef(0)
    useEffect(() => {
        if (openCreateTrigger > 0 && openCreateTrigger !== lastTriggerRef.current) {
            lastTriggerRef.current = openCreateTrigger
            setModal({ mode: 'create' })
        }
    }, [openCreateTrigger])

    async function handleFormSubmit(payload) {
        if (modal?.mode === 'edit') await modifica(modal.tx.id, payload)
        else await aggiungi(payload)
        setModal(null)
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

    // Totali mese
    const totSpese = transazioni.filter(t => t.tipo === 'spesa').reduce((s, t) => s + Number(t.importo), 0)
    const totEntrate = transazioni.filter(t => t.tipo === 'entrata').reduce((s, t) => s + Number(t.importo), 0)
    const saldo = totEntrate - totSpese

    // Trend saldo vs mese precedente
    const totSpesePrec = txPrec.filter(t => t.tipo === 'spesa').reduce((s, t) => s + Number(t.importo), 0)
    const totEntratePrec = txPrec.filter(t => t.tipo === 'entrata').reduce((s, t) => s + Number(t.importo), 0)
    const saldoPrec = totEntratePrec - totSpesePrec
    const trendSaldo = saldoPrec !== 0 ? ((saldo - saldoPrec) / Math.abs(saldoPrec)) * 100 : null

    // Budget
    const budgetTotale = categorie.reduce((s, c) => s + Number(c.budget_mensile ?? 0), 0)
    const pctBudget = budgetTotale > 0 ? Math.min(100, (totSpese / budgetTotale) * 100) : 0
    const restante = Math.max(budgetTotale - totSpese, 0)

    // Categoria top
    const topCat = useMemo(() => {
        const map = new Map()
        for (const t of transazioni) {
            if (t.tipo !== 'spesa') continue
            const k = t.categoria_id ?? 'nessuna'
            const cur = map.get(k) ?? { nome: t.categoria?.nome ?? 'Senza cat.', icona: t.categoria?.icona ?? '📄', tot: 0 }
            cur.tot += Number(t.importo)
            map.set(k, cur)
        }
        const list = Array.from(map.values()).sort((a, b) => b.tot - a.tot)
        return list[0] ?? null
    }, [transazioni])

    // Media giornaliera (calcolata inline: dipende solo da `mese` + `totSpese`)
    const giorniTrascorsi = (() => {
        const oggi = new Date()
        const [yM, mM] = mese.split('-').map(Number)
        if (oggi.getFullYear() === yM && oggi.getMonth() + 1 === mM) return oggi.getDate()
        return new Date(yM, mM, 0).getDate()
    })()
    const mediaGior = giorniTrascorsi > 0 ? totSpese / giorniTrascorsi : 0

    // Insights
    const insights = useMemo(() => generaInsights({
        txMese: transazioni, txMesePrec: txPrec, categorie,
    }), [transazioni, txPrec, categorie])

    const oggi = meseISO()
    const isMeseCorrente = mese === oggi

    function handleExport() {
        const csv = transazioniToCSV(transazioniFiltrate)
        const nome = `transazioni-${mese}.csv`
        downloadCSV(nome, csv)
    }

    const userName = user?.email?.split('@')[0] ?? 'Utente'

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

            {/* HERO */}
            <Hero
                saldo={saldo}
                totEntrate={totEntrate}
                totSpese={totSpese}
                trend={trendSaldo}
                isDesktop={isDesktop}
            />

            {/* MESE PICKER MOBILE */}
            {!isDesktop && (
                <div style={{ padding: '0 18px', marginBottom: 24 }}>
                    <MonthPicker mese={mese} setMese={setMese} oggi={oggi} isMeseCorrente={isMeseCorrente} mobile />
                </div>
            )}

            {/* KPI desktop / Quick stats mobile */}
            {isDesktop ? (
                <div style={S.kpis}>
                    <Kpi label="Budget" value={budgetTotale > 0 ? `${pctBudget.toFixed(0)}%` : '—'}
                        sub={budgetTotale > 0 ? `${formatEUR(restante)} disponibili` : 'Nessun budget'} />
                    <Kpi label="Transazioni" value={`${transazioni.length}`} sub={`${transazioniFiltrate.length} filtrate`} />
                    <Kpi label="Top categoria"
                        value={topCat ? `${topCat.icona} ${topCat.nome}` : '—'}
                        sub={topCat ? `${formatEUR(topCat.tot)}` : 'Nessuna spesa'} />
                    <Kpi label="Media giornaliera" value={formatEUR(mediaGior)}
                        sub={isMeseCorrente ? `su ${giorniTrascorsi} giorni` : 'mese completo'} />
                </div>
            ) : (
                <div style={S.mQuickStats}>
                    <MStat label="Entrate" value={formatEUR(totEntrate)} color="var(--success)" />
                    <MStat label="Spese" value={formatEUR(totSpese)} color="var(--accent)" />
                </div>
            )}

            {/* BUDGET BAR (compatto, sotto le KPI) */}
            {budgetTotale > 0 && (
                <div style={S.budgetCard}>
                    <div style={S.budgetHead}>
                        <span style={S.budgetLabel}>Budget totale</span>
                        <span style={S.budgetVal} className="num">
                            {formatEUR(totSpese)}<span style={{ color: 'var(--text-muted)' }}> / {formatEUR(budgetTotale)}</span>
                        </span>
                    </div>
                    <div style={S.progress} role="progressbar" aria-valuenow={Math.round(pctBudget)} aria-valuemin={0} aria-valuemax={100}>
                        <div style={{
                            ...S.progressBar,
                            width: `${pctBudget}%`,
                            background: pctBudget >= 100 ? 'var(--accent)' : pctBudget >= 80 ? 'var(--warning)' : 'var(--success)',
                        }} />
                    </div>
                </div>
            )}

            {/* GRID 2 COLONNE (desktop) o stack (mobile) */}
            {isDesktop ? (
                <div style={S.grid2}>
                    <div>
                        <Section title="Andamento settimana">
                            <WeekChart transazioni={transazioni} />
                        </Section>

                        <Section title="Movimenti recenti" right={
                            nFiltriAttivi > 0 ? (
                                <button onClick={resetFiltri} style={S.clearLink}>Azzera filtri</button>
                            ) : null
                        }>
                            <Collapsible title="🔎 Filtri" badge={nFiltriAttivi}>
                                <FiltriTransazioni categorie={categorie} filtri={filtri} setFiltri={setFiltri} onReset={resetFiltri} />
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
                            <BudgetList categorie={categorie} transazioni={transazioni} />
                        </Section>

                        <Section title="Per categoria">
                            <GraficoSpese transazioni={transazioni} />
                        </Section>
                    </div>
                </div>
            ) : (
                <>
                    {/* MOBILE: stack verticale */}
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
                        <BudgetList categorie={categorie} transazioni={transazioni} />
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
                            <FiltriTransazioni categorie={categorie} filtri={filtri} setFiltri={setFiltri} onReset={resetFiltri} />
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

            {/* MODALI */}
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
                onConfirm={async () => { if (toDelete) await elimina(toDelete.id); setToDelete(null) }}
                onCancel={() => setToDelete(null)}
            />
        </div>
    )
}

/* ============ Sub-componenti ============ */

function MonthPicker({ mese, setMese, oggi, isMeseCorrente, mobile }) {
    return (
        <div style={mobile ? S.monthBarMobile : S.monthBar}>
            <button onClick={() => setMese(mesePrec(mese))} style={S.monthNav} className="ix-btn-ghost" aria-label="Mese precedente">‹</button>
            <div style={S.monthCenter}>
                <div style={S.monthLabel}>{meseLabel(mese)}</div>
                {!isMeseCorrente && (
                    <button onClick={() => setMese(oggi)} style={S.monthToday}>Vai a oggi</button>
                )}
            </div>
            <button onClick={() => setMese(meseSucc(mese))} style={S.monthNav} className="ix-btn-ghost" aria-label="Mese successivo">›</button>
        </div>
    )
}

function Hero({ saldo, totEntrate, totSpese, trend, isDesktop }) {
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

function Kpi({ label, value, sub }) {
    return (
        <div style={S.kpi}>
            <div style={S.kpiLbl}>{label}</div>
            <div style={S.kpiVal} className="num">{value}</div>
            {sub && <div style={S.kpiSub}>{sub}</div>}
        </div>
    )
}

function MStat({ label, value, color }) {
    return (
        <div style={S.mStat}>
            <div style={S.kpiLbl}>{label}</div>
            <div style={{ ...S.mStatVal, color }} className="num">{value}</div>
        </div>
    )
}

function Section({ title, right, children }) {
    return (
        <div style={S.section}>
            <SectionHead title={title} right={right} />
            {children}
        </div>
    )
}

function SectionHead({ title, right }) {
    return (
        <div style={S.sectionHead}>
            <h2 style={S.h2}>{title}</h2>
            {right}
        </div>
    )
}

function BudgetList({ categorie, transazioni }) {
    const stat = useMemo(() => {
        const map = new Map()
        for (const t of transazioni) {
            if (t.tipo !== 'spesa' || !t.categoria_id) continue
            map.set(t.categoria_id, (map.get(t.categoria_id) ?? 0) + Number(t.importo))
        }
        return categorie
            .filter(c => Number(c.budget_mensile ?? 0) > 0)
            .map(c => ({
                ...c,
                speso: map.get(c.id) ?? 0,
                pct: Math.min(100, ((map.get(c.id) ?? 0) / c.budget_mensile) * 100),
            }))
            .sort((a, b) => b.pct - a.pct)
    }, [categorie, transazioni])

    if (stat.length === 0) {
        return (
            <div style={S.emptyBudget}>
                Nessun budget impostato. Vai in <a href="/categorie" style={S.linkInline}>Categorie</a> per crearne uno.
            </div>
        )
    }

    return (
        <div style={S.budgetList}>
            {stat.map(c => (
                <div key={c.id} style={S.budgetItem}>
                    <div style={{ ...S.budgetIcon, background: `${c.colore}22` }} aria-hidden="true">
                        {c.icona}
                    </div>
                    <div style={S.budgetMid}>
                        <div style={S.budgetTitle}>{c.nome}</div>
                        <div style={S.budgetBar}>
                            <div style={{
                                ...S.budgetFill,
                                width: `${c.pct}%`,
                                background: c.pct >= 100 ? 'var(--accent)' : c.pct >= 80 ? 'var(--warning)' : c.colore,
                            }} />
                        </div>
                    </div>
                    <div style={S.budgetAmt} className="num">
                        {formatEUR(c.speso)} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {formatEUR(c.budget_mensile)}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

function TxList({ transazioni, totaleNonFiltrato, loading, onEdit, onDelete, onAdd, ordine }) {
    const groupByDay = ordine === 'data_desc' || ordine === 'data_asc'

    const gruppi = useMemo(() => {
        if (!groupByDay) return null
        const map = new Map()
        for (const t of transazioni) {
            if (!map.has(t.data)) map.set(t.data, [])
            map.get(t.data).push(t)
        }
        return Array.from(map.entries())
    }, [transazioni, groupByDay])

    if (loading) return <SkeletonList />

    if (transazioni.length === 0) {
        return (
            <EmptyState
                title={totaleNonFiltrato === 0 ? 'Nessuna transazione' : 'Nessun risultato'}
                message={totaleNonFiltrato === 0
                    ? 'Inizia ad aggiungere le tue transazioni del mese.'
                    : 'Nessuna transazione corrisponde ai filtri.'}
                action={totaleNonFiltrato === 0
                    ? { label: '+ Aggiungi la prima', onClick: onAdd }
                    : null}
            />
        )
    }

    if (groupByDay && gruppi) {
        return (
            <div style={S.groups}>
                {gruppi.map(([giorno, txs], gi) => {
                    const totGiorno = txs.reduce((s, t) => s + (t.tipo === 'spesa' ? -1 : 1) * Number(t.importo), 0)
                    return (
                        <div key={giorno} style={S.dayBlock}>
                            <div style={S.dayHead}>
                                <span style={S.dayLabel}>{labelGiorno(giorno)}</span>
                                <span style={{
                                    ...S.dayTotal,
                                    color: totGiorno >= 0 ? 'var(--success)' : 'var(--accent)',
                                }} className="num">
                                    {totGiorno >= 0 ? '+' : '−'}{formatEUR(Math.abs(totGiorno))}
                                </span>
                            </div>
                            <div style={S.txList}>
                                {txs.map((t, i) => (
                                    <TxRow key={t.id} t={t} onEdit={() => onEdit(t)} onDelete={() => onDelete(t)} delay={gi * 3 + i} />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div style={S.txList}>
            {transazioni.map((t, i) => (
                <TxRow key={t.id} t={t} onEdit={() => onEdit(t)} onDelete={() => onDelete(t)} delay={i} />
            ))}
        </div>
    )
}

function TxRow({ t, onEdit, onDelete, delay = 0 }) {
    const colorIcon = t.categoria?.colore ?? '#a78bfa'
    return (
        <div
            style={{ ...S.tx, animationDelay: `${Math.min(delay, 10) * 25}ms` }}
            className="ix-item list-enter"
        >
            <div style={{ ...S.txEmoji, background: `${colorIcon}22` }} aria-hidden="true">
                {t.categoria?.icona ?? '📄'}
            </div>
            <div style={S.txBody}>
                <div style={S.txTitle}>{t.descrizione || t.categoria?.nome || '(senza descrizione)'}</div>
                <div style={S.txSub}>{t.categoria?.nome ?? 'senza categoria'}</div>
            </div>
            <div style={S.txRight}>
                <div style={{
                    ...S.txAmt,
                    color: t.tipo === 'spesa' ? 'var(--accent)' : 'var(--success)',
                }} className="num">
                    {t.tipo === 'spesa' ? '−' : '+'}{formatEUR(t.importo)}
                </div>
                <button onClick={onEdit} style={S.txBtn} className="ix-btn-icon" aria-label="Modifica transazione">✏️</button>
                <button onClick={onDelete} style={S.txBtn} className="ix-btn-icon" aria-label="Elimina transazione">🗑️</button>
            </div>
        </div>
    )
}

function SkeletonList() {
    return (
        <div style={S.skelWrap} aria-hidden="true">
            {[0, 1, 2].map(i => (
                <div key={i} style={S.skelItem}>
                    <div style={S.skelIcon} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ ...S.skelLine, width: '60%' }} />
                        <div style={{ ...S.skelLine, width: '40%', height: 10 }} />
                    </div>
                    <div style={{ ...S.skelLine, width: 60 }} />
                </div>
            ))}
        </div>
    )
}

function EmptyState({ title, message, action }) {
    return (
        <div style={S.empty}>
            <div style={S.emptyIcon} aria-hidden="true">📭</div>
            <div style={S.emptyTitle}>{title}</div>
            <div style={S.emptyMsg}>{message}</div>
            {action && (
                <button onClick={action.onClick} style={S.emptyBtn} className="ix-btn-primary">
                    {action.label}
                </button>
            )}
        </div>
    )
}

function labelGiorno(iso) {
    const [y, m, d] = iso.split('-').map(Number)
    const data = new Date(y, m - 1, d)
    const oggi = new Date(); oggi.setHours(0, 0, 0, 0)
    const ieri = new Date(oggi); ieri.setDate(ieri.getDate() - 1)
    const dataMid = new Date(data); dataMid.setHours(0, 0, 0, 0)
    if (dataMid.getTime() === oggi.getTime()) return 'Oggi'
    if (dataMid.getTime() === ieri.getTime()) return 'Ieri'
    return data.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' })
}

const S = {
    app: { padding: 0 },

    /* DESKTOP top */
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

    /* MOBILE header */
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

    /* HERO */
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

    /* MOBILE quick stats */
    mQuickStats: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        padding: '0 18px',
        marginBottom: 20,
    },
    mStat: {
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        boxShadow: 'var(--shadow-sm)',
    },
    mStatVal: { fontSize: 18, fontWeight: 800, marginTop: 4 },

    /* KPI desktop */
    kpis: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        background: 'var(--line)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        marginBottom: 28,
        boxShadow: 'var(--shadow-sm)',
    },
    kpi: { background: 'var(--surface)', padding: '18px 22px 20px' },
    kpiLbl: {
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontWeight: 700,
        marginBottom: 8,
    },
    kpiVal: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    kpiSub: { marginTop: 4, fontSize: 12, color: 'var(--text-muted)' },

    /* Month picker */
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

    /* Budget compatto sopra */
    budgetCard: {
        background: 'var(--surface)',
        padding: '14px 18px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 24,
        marginLeft: 18,
        marginRight: 18,
    },
    budgetHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' },
    budgetLabel: {
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontWeight: 700,
    },
    budgetVal: { fontSize: 14, fontWeight: 700 },
    progress: { height: 6, background: 'var(--bg-2)', borderRadius: 999, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 999, transition: 'width .3s ease, background .3s' },

    /* GRID main */
    grid2: { display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 28 },
    section: { marginBottom: 28 },
    mSection: { padding: '0 18px', marginBottom: 24 },
    sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, gap: 12, flexWrap: 'wrap' },
    h2: {
        margin: 0,
        fontFamily: 'var(--font-serif)',
        fontSize: 22,
        fontWeight: 500,
        letterSpacing: '-0.02em',
    },
    clearLink: {
        background: 'transparent',
        border: 'none',
        color: 'var(--accent)',
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'underline',
        padding: 0,
    },
    linkInline: { color: 'var(--accent)', fontWeight: 600 },

    /* BUDGET LIST */
    budgetList: {
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
    },
    budgetItem: {
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto',
        gap: 14,
        alignItems: 'center',
        padding: '14px 18px',
        borderBottom: '1px solid var(--line)',
    },
    budgetIcon: {
        width: 40, height: 40,
        borderRadius: 12,
        display: 'grid',
        placeItems: 'center',
        fontSize: 18,
    },
    budgetMid: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 },
    budgetTitle: { fontSize: 14, fontWeight: 600 },
    budgetBar: { height: 5, background: 'var(--bg-2)', borderRadius: 999, overflow: 'hidden' },
    budgetFill: { height: '100%', borderRadius: 999, transition: 'width .3s' },
    budgetAmt: { fontSize: 13, fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' },
    emptyBudget: {
        padding: '16px 18px',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-muted)',
        fontSize: 13.5,
        textAlign: 'center',
    },

    /* TX LIST */
    txList: {
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
    },
    groups: { display: 'flex', flexDirection: 'column', gap: 18 },
    dayBlock: {},
    dayHead: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 4px',
        marginBottom: 4,
    },
    dayLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.10em',
        color: 'var(--text-muted)',
        fontWeight: 700,
    },
    dayTotal: { fontSize: 12, fontWeight: 700 },
    tx: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
    },
    txEmoji: {
        width: 40, height: 40,
        borderRadius: 12,
        display: 'grid',
        placeItems: 'center',
        fontSize: 18,
        flexShrink: 0,
    },
    txBody: { flex: 1, minWidth: 0 },
    txTitle: { fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    txSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
    txRight: { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 },
    txAmt: { fontSize: 14, fontWeight: 700, marginRight: 4 },
    txBtn: {
        background: 'transparent',
        border: 'none',
        width: 32, height: 32,
        borderRadius: 'var(--radius-sm)',
        fontSize: 15,
        opacity: 0.7,
        display: 'grid',
        placeItems: 'center',
    },

    /* SKELETON */
    skelWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
    skelItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--line)',
    },
    skelIcon: {
        width: 40, height: 40,
        borderRadius: 12,
        background: 'linear-gradient(90deg, var(--bg-2), var(--surface-3), var(--bg-2))',
        backgroundSize: '400px 100%',
        animation: 'shimmer 1.4s linear infinite',
    },
    skelLine: {
        height: 12,
        borderRadius: 6,
        background: 'linear-gradient(90deg, var(--bg-2), var(--surface-3), var(--bg-2))',
        backgroundSize: '400px 100%',
        animation: 'shimmer 1.4s linear infinite',
    },

    /* EMPTY */
    empty: { textAlign: 'center', padding: '40px 20px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' },
    emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.6 },
    emptyTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
    emptyMsg: { color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 },
    emptyBtn: {
        padding: '10px 18px',
        background: 'var(--grad-hero)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        fontWeight: 700,
        fontSize: 13,
        boxShadow: 'var(--shadow-coral)',
    },
}
