import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCategorie } from '../hooks/useCategorie'
import { useTransazioni } from '../hooks/useTransazioni'
import {
    formatEUR, formatData,
    meseISO, intervalloMese, meseLabel, mesePrec, meseSucc,
} from '../utils/format'
import GraficoSpese from './GraficoSpese'
import FiltriTransazioni from './FiltriTransazioni'
import Modal from './Modal'
import ConfirmDialog from './ConfirmDialog'
import Collapsible from './Collapsible'
import TransazioneForm from './TransazioneForm'

const FILTRI_INIZIALI = {
    search: '', tipo: 'tutti', categorieSel: [],
    importoMin: '', importoMax: '', dataDa: '', dataA: '', ordine: 'data_desc',
}

export default function Home() {
    const { user, signOut } = useAuth()
    const { categorie, loading: catLoading } = useCategorie()

    const [mese, setMese] = useState(meseISO())
    const { from, to } = useMemo(() => intervalloMese(mese), [mese])
    const { transazioni, loading: txLoading, aggiungi, modifica, elimina } =
        useTransazioni({ from, to })

    const [modal, setModal] = useState(null)
    const [toDelete, setToDelete] = useState(null) // { id, descrizione }
    const [filtri, setFiltri] = useState(FILTRI_INIZIALI)

    async function handleFormSubmit(payload) {
        if (modal?.mode === 'edit') {
            await modifica(modal.tx.id, payload)
        } else {
            await aggiungi(payload)
        }
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

    const risultatiFiltro = useMemo(() => ({
        count: transazioniFiltrate.length,
        totaleSpese: transazioniFiltrate.filter(t => t.tipo === 'spesa').reduce((s, t) => s + Number(t.importo), 0),
        totaleEntrate: transazioniFiltrate.filter(t => t.tipo === 'entrata').reduce((s, t) => s + Number(t.importo), 0),
    }), [transazioniFiltrate])

    // raggruppamento per giorno (solo se ordine cronologico)
    const groupByDay = filtri.ordine === 'data_desc' || filtri.ordine === 'data_asc'
    const gruppi = useMemo(() => {
        if (!groupByDay) return null
        const map = new Map()
        for (const t of transazioniFiltrate) {
            if (!map.has(t.data)) map.set(t.data, [])
            map.get(t.data).push(t)
        }
        return Array.from(map.entries())
    }, [transazioniFiltrate, groupByDay])

    const totSpese = transazioni.filter(t => t.tipo === 'spesa').reduce((s, t) => s + Number(t.importo), 0)
    const totEntrate = transazioni.filter(t => t.tipo === 'entrata').reduce((s, t) => s + Number(t.importo), 0)
    const saldo = totEntrate - totSpese
    const budgetTotale = categorie.reduce((s, c) => s + Number(c.budget_mensile ?? 0), 0)
    const pctBudget = budgetTotale > 0 ? Math.min(100, (totSpese / budgetTotale) * 100) : 0

    const oggi = meseISO()
    const isMeseCorrente = mese === oggi
    const filtroAttivo = nFiltriAttivi > 0

    return (
        <div style={S.app}>
            <header style={S.header}>
                <div style={S.headerLeft}>
                    <h1 style={S.title}>💰 Expense Tracker</h1>
                    <p style={S.userline} className="hide-mobile">{user?.email}</p>
                </div>
                <div style={S.headerActions}>
                    <button
                        onClick={() => setModal({ mode: 'create' })}
                        style={S.btnAdd}
                        className="ix-btn-primary hide-mobile"
                    >
                        + Nuova transazione
                    </button>
                    <Link
                        to="/categorie"
                        style={S.btnGhost}
                        className="ix-btn-ghost"
                        aria-label="Gestisci categorie"
                    >
                        <span aria-hidden="true">🏷️</span>
                        <span className="hide-mobile">Categorie</span>
                    </Link>
                    <button
                        onClick={signOut}
                        style={S.btnGhost}
                        className="ix-btn-ghost"
                        aria-label="Esci dall'account"
                    >
                        <span className="hide-mobile">Esci</span>
                        <span className="show-mobile-only" aria-hidden="true">⎋</span>
                    </button>
                </div>
            </header>

            {/* SELETTORE MESE */}
            <section style={S.monthBar} aria-label="Selettore mese">
                <button
                    onClick={() => setMese(mesePrec(mese))}
                    style={S.monthNav}
                    className="ix-btn-ghost"
                    aria-label="Mese precedente"
                >
                    ◀
                </button>
                <div style={S.monthCenter}>
                    <div style={S.monthLabel}>{meseLabel(mese)}</div>
                    {!isMeseCorrente && (
                        <button onClick={() => setMese(oggi)} style={S.monthToday}>
                            Vai a oggi
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setMese(meseSucc(mese))}
                    style={S.monthNav}
                    className="ix-btn-ghost"
                    aria-label="Mese successivo"
                >
                    ▶
                </button>
            </section>

            {/* CARDS */}
            <section style={S.cards} className="grid-cards" aria-label="Riepilogo mese">
                <Card label="Entrate" value={formatEUR(totEntrate)} color="var(--success)" />
                <Card label="Spese" value={formatEUR(totSpese)} color="var(--danger)" />
                <Card label="Saldo" value={formatEUR(saldo)} color={saldo >= 0 ? 'var(--success)' : 'var(--danger)'} />
            </section>

            {/* BUDGET */}
            {budgetTotale > 0 && (
                <section style={S.budgetCard} aria-label="Budget del mese">
                    <div style={S.budgetHead}>
                        <span style={S.budgetLabel}>Budget totale del mese</span>
                        <span style={S.budgetVal}>
                            {formatEUR(totSpese)}
                            <span style={{ color: 'var(--text-muted)' }}> / {formatEUR(budgetTotale)}</span>
                        </span>
                    </div>
                    <div
                        style={S.progress}
                        role="progressbar"
                        aria-valuenow={Math.round(pctBudget)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div style={{
                            ...S.progressBar,
                            width: `${pctBudget}%`,
                            background: pctBudget >= 100 ? 'var(--danger)' : pctBudget >= 80 ? 'var(--warning)' : 'var(--success)',
                        }} />
                    </div>
                    <div style={S.budgetFoot}>
                        {pctBudget >= 100
                            ? `⚠️ Hai superato il budget di ${formatEUR(totSpese - budgetTotale)}`
                            : `Restano ${formatEUR(budgetTotale - totSpese)} (${(100 - pctBudget).toFixed(0)}%)`}
                    </div>
                </section>
            )}

            {/* GRAFICO */}
            <GraficoSpese transazioni={transazioni} categorie={categorie} />

            {/* FILTRI collassabili */}
            <Collapsible title="🔎 Filtri" badge={nFiltriAttivi} defaultOpen={false}>
                <FiltriTransazioni
                    categorie={categorie}
                    filtri={filtri}
                    setFiltri={setFiltri}
                    onReset={resetFiltri}
                />
            </Collapsible>

            {/* LISTA */}
            <section style={S.section} aria-label="Lista transazioni">
                <div style={S.listHead}>
                    <h2 style={S.h2}>Transazioni di {meseLabel(mese)}</h2>
                    {filtroAttivo && (
                        <button
                            onClick={resetFiltri}
                            style={S.clearMini}
                            className="ix-btn-ghost"
                        >
                            Azzera filtri
                        </button>
                    )}
                </div>

                <div style={S.summary}>
                    <span style={S.summaryCount}>
                        {risultatiFiltro.count} {risultatiFiltro.count === 1 ? 'transazione' : 'transazioni'}
                        {filtroAttivo && <span style={S.filteredTag}> (filtrate)</span>}
                    </span>
                    <span style={S.summaryAmts}>
                        {risultatiFiltro.totaleEntrate > 0 && (
                            <span style={{ color: 'var(--success)' }}>+{formatEUR(risultatiFiltro.totaleEntrate)}</span>
                        )}
                        {risultatiFiltro.totaleSpese > 0 && (
                            <span style={{ color: 'var(--danger)' }}>−{formatEUR(risultatiFiltro.totaleSpese)}</span>
                        )}
                    </span>
                </div>

                {filtroAttivo && (
                    <ChipsAttivi filtri={filtri} setFiltri={setFiltri} categorie={categorie} />
                )}

                {txLoading ? (
                    <SkeletonList />
                ) : transazioniFiltrate.length === 0 ? (
                    <EmptyState
                        title={transazioni.length === 0 ? 'Nessuna transazione' : 'Nessun risultato'}
                        message={transazioni.length === 0
                            ? `Nessuna transazione registrata in ${meseLabel(mese)}.`
                            : 'Prova a modificare o azzerare i filtri.'}
                        action={transazioni.length === 0
                            ? { label: '+ Aggiungi la prima', onClick: () => setModal({ mode: 'create' }) }
                            : { label: 'Azzera filtri', onClick: resetFiltri }}
                    />
                ) : groupByDay && gruppi ? (
                    <div style={S.groupsWrap}>
                        {gruppi.map(([giorno, txs], i) => (
                            <GiornoGruppo
                                key={giorno}
                                giorno={giorno}
                                transazioni={txs}
                                onEdit={(t) => setModal({ mode: 'edit', tx: t })}
                                onDelete={(t) => setToDelete(t)}
                                delay={i}
                            />
                        ))}
                    </div>
                ) : (
                    <ul style={S.list}>
                        {transazioniFiltrate.map((t, i) => (
                            <TransazioneRow
                                key={t.id}
                                t={t}
                                onEdit={() => setModal({ mode: 'edit', tx: t })}
                                onDelete={() => setToDelete(t)}
                                delay={i}
                            />
                        ))}
                    </ul>
                )}
            </section>

            {/* FAB */}
            <button
                onClick={() => setModal({ mode: 'create' })}
                style={S.fab}
                className="ix-fab"
                aria-label="Aggiungi nuova transazione"
            >
                <span aria-hidden="true">+</span>
            </button>

            {/* MODALE FORM */}
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

            {/* CONFERMA ELIMINAZIONE */}
            <ConfirmDialog
                open={toDelete !== null}
                title="Eliminare transazione?"
                message={toDelete
                    ? `Stai per eliminare:\n"${toDelete.descrizione || toDelete.categoria?.nome || 'transazione senza descrizione'}" da ${formatData(toDelete.data)}.\n\nL'operazione non può essere annullata.`
                    : ''}
                confirmLabel="Elimina"
                danger
                onConfirm={async () => {
                    if (toDelete) await elimina(toDelete.id)
                    setToDelete(null)
                }}
                onCancel={() => setToDelete(null)}
            />
        </div>
    )
}

function Card({ label, value, color }) {
    return (
        <div style={S.card} className="ix-lift">
            <div style={S.cardLabel}>{label}</div>
            <div style={{ ...S.cardValue, color }}>{value}</div>
        </div>
    )
}

function GiornoGruppo({ giorno, transazioni, onEdit, onDelete, delay = 0 }) {
    const totale = transazioni.reduce(
        (s, t) => s + (t.tipo === 'spesa' ? -1 : 1) * Number(t.importo), 0
    )
    return (
        <div className="list-enter" style={{ animationDelay: `${delay * 20}ms` }}>
            <div style={S.gruppoHead}>
                <span style={S.gruppoData}>{labelGiorno(giorno)}</span>
                <span style={{
                    ...S.gruppoTot,
                    color: totale >= 0 ? 'var(--success)' : 'var(--danger)',
                }}>
                    {totale >= 0 ? '+' : '−'}{formatEUR(Math.abs(totale))}
                </span>
            </div>
            <ul style={S.list}>
                {transazioni.map((t, i) => (
                    <TransazioneRow
                        key={t.id}
                        t={t}
                        onEdit={() => onEdit(t)}
                        onDelete={() => onDelete(t)}
                        delay={i}
                        hideData
                    />
                ))}
            </ul>
        </div>
    )
}

function TransazioneRow({ t, onEdit, onDelete, hideData = false, delay = 0 }) {
    return (
        <li
            style={{ ...S.item, animationDelay: `${Math.min(delay, 8) * 20}ms` }}
            className="ix-item list-enter"
        >
            <div style={S.itemLeft}>
                <div style={{
                    ...S.itemIcon,
                    background: t.categoria?.colore ? `${t.categoria.colore}22` : 'rgba(255,255,255,.04)',
                }}>
                    <span aria-hidden="true">{t.categoria?.icona ?? '📄'}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={S.itemTitle}>
                        {t.descrizione || t.categoria?.nome || '(senza descrizione)'}
                    </div>
                    <div style={S.itemSub}>
                        {hideData ? (t.categoria?.nome ?? 'senza categoria')
                            : `${formatData(t.data)} · ${t.categoria?.nome ?? 'senza categoria'}`}
                    </div>
                </div>
            </div>
            <div style={S.itemRight}>
                <div style={{
                    ...S.amount,
                    color: t.tipo === 'spesa' ? 'var(--danger)' : 'var(--success)',
                }}>
                    {t.tipo === 'spesa' ? '−' : '+'}{formatEUR(t.importo)}
                </div>
                <button
                    onClick={onEdit}
                    style={S.btnIcon}
                    className="ix-btn-icon"
                    aria-label={`Modifica transazione "${t.descrizione || t.categoria?.nome || ''}"`}
                >
                    <span aria-hidden="true">✏️</span>
                </button>
                <button
                    onClick={onDelete}
                    style={S.btnIcon}
                    className="ix-btn-icon"
                    aria-label={`Elimina transazione "${t.descrizione || t.categoria?.nome || ''}"`}
                >
                    <span aria-hidden="true">🗑️</span>
                </button>
            </div>
        </li>
    )
}

function ChipsAttivi({ filtri, setFiltri, categorie }) {
    const set = (campo, valore) => setFiltri(prev => ({ ...prev, [campo]: valore }))
    const toggleCat = (id) => setFiltri(prev => ({ ...prev, categorieSel: prev.categorieSel.filter(c => c !== id) }))

    const chips = []
    if (filtri.search.trim()) chips.push({ k: 's', label: `"${filtri.search}"`, rm: () => set('search', '') })
    if (filtri.tipo !== 'tutti') chips.push({ k: 't', label: filtri.tipo === 'spesa' ? 'Solo spese' : 'Solo entrate', rm: () => set('tipo', 'tutti') })
    filtri.categorieSel.forEach(id => {
        const c = categorie.find(x => x.id === id)
        if (c) chips.push({ k: 'c' + id, label: `${c.icona} ${c.nome}`, rm: () => toggleCat(id) })
    })
    if (filtri.importoMin !== '') chips.push({ k: 'min', label: `≥ ${formatEUR(filtri.importoMin)}`, rm: () => set('importoMin', '') })
    if (filtri.importoMax !== '') chips.push({ k: 'max', label: `≤ ${formatEUR(filtri.importoMax)}`, rm: () => set('importoMax', '') })
    if (filtri.dataDa) chips.push({ k: 'dd', label: `da ${formatData(filtri.dataDa)}`, rm: () => set('dataDa', '') })
    if (filtri.dataA) chips.push({ k: 'da', label: `a ${formatData(filtri.dataA)}`, rm: () => set('dataA', '') })

    return (
        <div style={S.chips}>
            {chips.map(c => (
                <span key={c.k} style={S.chip}>
                    {c.label}
                    <button
                        onClick={c.rm}
                        style={S.chipX}
                        aria-label={`Rimuovi filtro ${c.label}`}
                    >
                        ✕
                    </button>
                </span>
            ))}
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
            <style>{`@keyframes shimmer { 0%{background-position:-200px 0;} 100%{background-position:200px 0;} }`}</style>
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
                <button
                    onClick={action.onClick}
                    style={S.emptyBtn}
                    className="ix-btn-primary"
                >
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
    app: {
        minHeight: '100vh',
        background: 'var(--grad-bg)',
        color: 'var(--text)',
        padding: 'clamp(1rem, 4vw, 3rem)',
        paddingTop: 'calc(clamp(1rem, 4vw, 3rem) + var(--safe-top))',
        paddingBottom: 'calc(100px + var(--safe-bottom))',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    headerLeft: { minWidth: 0, flex: '1 1 auto' },
    headerActions: { display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' },
    title: { margin: 0, fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700 },
    userline: { margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    btnAdd: {
        padding: '10px 16px',
        background: 'var(--grad-accent)',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        color: 'white',
        fontSize: 13,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        lineHeight: 1.4,
    },
    btnGhost: {
        padding: '10px 14px',
        background: 'transparent',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text)',
        fontSize: 13,
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        lineHeight: 1.4,
        minHeight: 38,
    },
    btnIcon: {
        background: 'transparent',
        border: 'none',
        fontSize: 18,
        padding: 8,
        opacity: .7,
        borderRadius: 'var(--radius-sm)',
        lineHeight: 1,
        minWidth: 36,
        minHeight: 36,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '10px 16px',
        border: '1px solid var(--border-subtle)',
        marginBottom: 24,
    },
    monthNav: {
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255,255,255,.04)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        fontSize: 14,
    },
    monthCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
    monthLabel: { fontSize: 18, fontWeight: 600 },
    monthToday: {
        fontSize: 12,
        color: 'var(--accent)',
        background: 'transparent',
        border: 'none',
        textDecoration: 'underline',
        padding: 0,
    },
    cards: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 16,
    },
    card: {
        background: 'var(--surface)',
        padding: 20,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
    },
    cardLabel: { color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    cardValue: { fontSize: 24, fontWeight: 700, marginTop: 8 },
    budgetCard: {
        background: 'var(--surface)',
        padding: 20,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        marginBottom: 24,
    },
    budgetHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
    budgetLabel: { color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    budgetVal: { fontSize: 16, fontWeight: 600 },
    progress: {
        height: 8,
        background: 'rgba(255,255,255,.06)',
        borderRadius: 'var(--radius-pill)',
        overflow: 'hidden',
    },
    progressBar: { height: '100%', borderRadius: 'var(--radius-pill)', transition: 'width .3s ease, background .3s' },
    budgetFoot: { marginTop: 8, fontSize: 12, color: 'var(--text-muted)' },
    section: {
        background: 'var(--surface)',
        padding: 24,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        marginBottom: 24,
    },
    listHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8, flexWrap: 'wrap' },
    h2: { margin: 0, fontSize: 18 },
    clearMini: {
        background: 'transparent',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-muted)',
        fontSize: 12,
        padding: '6px 12px',
    },
    summary: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 14px',
        background: 'var(--bg)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 12,
        flexWrap: 'wrap',
        gap: 8,
    },
    summaryCount: { color: 'var(--text)', fontSize: 14, fontWeight: 500 },
    filteredTag: { color: 'var(--accent)', fontSize: 12 },
    summaryAmts: { display: 'flex', gap: 12, fontSize: 14, fontWeight: 600 },
    chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 6px 4px 12px',
        background: 'var(--accent-soft-2)',
        border: '1px solid var(--accent-ring)',
        borderRadius: 'var(--radius-pill)',
        color: 'var(--text)',
        fontSize: 12,
    },
    chipX: {
        background: 'transparent',
        border: 'none',
        color: 'var(--accent)',
        fontSize: 12,
        padding: '0 4px',
        lineHeight: 1,
    },
    list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
    groupsWrap: { display: 'flex', flexDirection: 'column', gap: 18 },
    gruppoHead: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '0 4px 8px',
        marginBottom: 4,
        borderBottom: '1px solid var(--border-subtle)',
    },
    gruppoData: { color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 },
    gruppoTot: { fontSize: 13, fontWeight: 600 },
    item: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 14px',
        background: 'var(--bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        gap: 12,
    },
    itemLeft: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 },
    itemIcon: {
        fontSize: 22,
        width: 40,
        height: 40,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 'var(--radius-md)',
        flexShrink: 0,
    },
    itemTitle: { fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    itemSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    itemRight: { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 },
    amount: { fontWeight: 600, fontSize: 15, marginRight: 4 },
    // EMPTY
    empty: { textAlign: 'center', padding: '32px 20px' },
    emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.6 },
    emptyTitle: { fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 },
    emptyMsg: { color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 },
    emptyBtn: {
        padding: '10px 18px',
        background: 'var(--grad-accent)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        fontWeight: 600,
        fontSize: 13,
    },
    // SKELETON
    skelWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
    skelItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: 'var(--bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
    },
    skelIcon: {
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(90deg, rgba(255,255,255,.04), rgba(255,255,255,.08), rgba(255,255,255,.04))',
        backgroundSize: '400px 100%',
        animation: 'shimmer 1.4s linear infinite',
    },
    skelLine: {
        height: 12,
        borderRadius: 6,
        background: 'linear-gradient(90deg, rgba(255,255,255,.04), rgba(255,255,255,.08), rgba(255,255,255,.04))',
        backgroundSize: '400px 100%',
        animation: 'shimmer 1.4s linear infinite',
    },
    // FAB
    fab: {
        position: 'fixed',
        right: 'clamp(16px, 4vw, 32px)',
        bottom: 'calc(clamp(16px, 4vw, 32px) + var(--safe-bottom))',
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--grad-accent)',
        border: 'none',
        color: 'white',
        fontSize: 28,
        boxShadow: 'var(--shadow-accent)',
        zIndex: 100,
        display: 'grid',
        placeItems: 'center',
        lineHeight: 1,
    },
}
