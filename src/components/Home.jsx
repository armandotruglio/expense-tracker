import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCategorie } from '../hooks/useCategorie'
import { useTransazioni } from '../hooks/useTransazioni'
import {
    formatEUR, formatData, oggiISO,
    meseISO, intervalloMese, meseLabel, mesePrec, meseSucc,
} from '../utils/format'
import GraficoSpese from './GraficoSpese'
import FiltriTransazioni from './FiltriTransazioni'
import Modal from './Modal'
import Collapsible from './Collapsible'
import TransazioneForm from './TransazioneForm'

export default function Home() {
    const { user, signOut } = useAuth()
    const { categorie, loading: catLoading } = useCategorie()

    const [mese, setMese] = useState(meseISO())
    const { from, to } = useMemo(() => intervalloMese(mese), [mese])
    const { transazioni, loading: txLoading, aggiungi, modifica, elimina } =
        useTransazioni({ from, to })

    // modale: { mode: 'create' | 'edit', tx?: {...} } oppure null
    const [modal, setModal] = useState(null)

    async function handleFormSubmit(payload) {
        if (modal?.mode === 'edit') {
            await modifica(modal.tx.id, payload)
        } else {
            await aggiungi(payload)
        }
        setModal(null)
    }

    // ---- FILTRI ----
    const FILTRI_INIZIALI = {
        search: '', tipo: 'tutti', categorieSel: [],
        importoMin: '', importoMax: '', dataDa: '', dataA: '', ordine: 'data_desc',
    }
    const [filtri, setFiltri] = useState(FILTRI_INIZIALI)
    const resetFiltri = () => setFiltri(FILTRI_INIZIALI)

    // conteggio filtri attivi (per badge sul collassabile)
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

    // totali del mese (per le card, sempre sul mese intero)
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
                <div>
                    <h1 style={S.title}>💰 Expense Tracker</h1>
                    <p style={S.userline}>{user?.email}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => setModal({ mode: 'create' })} style={S.btnAdd}>+ Nuova transazione</button>
                    <Link to="/categorie" style={S.btnGhost}>🏷️ Categorie</Link>
                    <button onClick={signOut} style={S.btnGhost}>Esci</button>
                </div>
            </header>

            {/* SELETTORE MESE */}
            <section style={S.monthBar}>
                <button onClick={() => setMese(mesePrec(mese))} style={S.monthNav}>◀</button>
                <div style={S.monthCenter}>
                    <div style={S.monthLabel}>{meseLabel(mese)}</div>
                    {!isMeseCorrente && <button onClick={() => setMese(oggi)} style={S.monthToday}>Vai a oggi</button>}
                </div>
                <button onClick={() => setMese(meseSucc(mese))} style={S.monthNav}>▶</button>
            </section>

            {/* CARDS */}
            <section style={S.cards} className="grid-cards">
                <Card label="Entrate" value={formatEUR(totEntrate)} color="#00d4aa" />
                <Card label="Spese" value={formatEUR(totSpese)} color="#ff6b6b" />
                <Card label="Saldo" value={formatEUR(saldo)} color={saldo >= 0 ? '#00d4aa' : '#ff6b6b'} />
            </section>

            {/* BUDGET */}
            {budgetTotale > 0 && (
                <section style={S.budgetCard}>
                    <div style={S.budgetHead}>
                        <span style={S.budgetLabel}>Budget totale del mese</span>
                        <span style={S.budgetVal}>{formatEUR(totSpese)} <span style={{ color: '#a0a0a0' }}>/ {formatEUR(budgetTotale)}</span></span>
                    </div>
                    <div style={S.progress}>
                        <div style={{ ...S.progressBar, width: `${pctBudget}%`, background: pctBudget >= 100 ? '#ff6b6b' : pctBudget >= 80 ? '#ffb319' : '#00d4aa' }} />
                    </div>
                    <div style={S.budgetFoot}>
                        {pctBudget >= 100 ? `⚠️ Hai superato il budget di ${formatEUR(totSpese - budgetTotale)}` : `Restano ${formatEUR(budgetTotale - totSpese)} (${(100 - pctBudget).toFixed(0)}%)`}
                    </div>
                </section>
            )}

            {/* GRAFICO */}
            <GraficoSpese transazioni={transazioni} categorie={categorie} />

            {/* ===== ZONA ESPLORA (filtri + lista uniti) ===== */}

            {/* Filtri collassabili */}
            <Collapsible title="🔎 Filtri" badge={nFiltriAttivi} defaultOpen={false}>
                <FiltriTransazioni
                    categorie={categorie}
                    filtri={filtri}
                    setFiltri={setFiltri}
                    onReset={resetFiltri}
                />
            </Collapsible>

            {/* Lista con riepilogo sempre visibile attaccato sopra */}
            <section style={S.section}>
                <div style={S.listHead}>
                    <h2 style={S.h2}>Transazioni di {meseLabel(mese)}</h2>
                    {filtroAttivo && <button onClick={resetFiltri} style={S.clearMini}>Azzera filtri</button>}
                </div>

                {/* RIEPILOGO RISULTATI — sempre visibile */}
                <div style={S.summary}>
                    <span style={S.summaryCount}>
                        {risultatiFiltro.count} {risultatiFiltro.count === 1 ? 'transazione' : 'transazioni'}
                        {filtroAttivo && <span style={S.filteredTag}> (filtrate)</span>}
                    </span>
                    <span style={S.summaryAmts}>
                        {risultatiFiltro.totaleEntrate > 0 && <span style={{ color: '#00d4aa' }}>+{formatEUR(risultatiFiltro.totaleEntrate)}</span>}
                        {risultatiFiltro.totaleSpese > 0 && <span style={{ color: '#ff6b6b' }}>−{formatEUR(risultatiFiltro.totaleSpese)}</span>}
                    </span>
                </div>

                {/* CHIP filtri attivi */}
                {filtroAttivo && (
                    <ChipsAttivi filtri={filtri} setFiltri={setFiltri} categorie={categorie} />
                )}

                {/* LISTA */}
                {txLoading ? (
                    <p style={S.muted}>Caricamento…</p>
                ) : transazioniFiltrate.length === 0 ? (
                    <p style={S.muted}>{transazioni.length === 0 ? 'Nessuna transazione in questo mese' : 'Nessuna transazione corrisponde ai filtri'}</p>
                ) : (
                    <ul style={S.list}>
                        {transazioniFiltrate.map(t => (
                            <li key={t.id} style={S.item}>
                                <div style={S.itemLeft}>
                                    <div style={{ ...S.itemIcon, background: t.categoria?.colore ? `${t.categoria.colore}22` : 'rgba(255,255,255,.04)' }}>
                                        {t.categoria?.icona ?? '📄'}
                                    </div>
                                    <div>
                                        <div style={S.itemTitle}>{t.descrizione || t.categoria?.nome || '(senza descrizione)'}</div>
                                        <div style={S.itemSub}>{formatData(t.data)} · {t.categoria?.nome ?? 'senza categoria'}</div>
                                    </div>
                                </div>
                                <div style={S.itemRight}>
                                    <div style={{ ...S.amount, color: t.tipo === 'spesa' ? '#ff6b6b' : '#00d4aa' }}>
                                        {t.tipo === 'spesa' ? '−' : '+'}{formatEUR(t.importo)}
                                    </div>
                                    <button onClick={() => setModal({ mode: 'edit', tx: t })} style={S.btnIcon} title="Modifica">✏️</button>
                                    <button onClick={() => { if (confirm('Eliminare questa transazione?')) elimina(t.id) }} style={S.btnIcon} title="Elimina">🗑️</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* FAB — sempre visibile */}
            <button onClick={() => setModal({ mode: 'create' })} style={S.fab} title="Nuova transazione">+</button>

            {/* MODALE */}
            <Modal
                open={modal !== null}
                onClose={() => setModal(null)}
                title={modal?.mode === 'edit' ? '✏️ Modifica transazione' : '+ Nuova transazione'}
            >
                <TransazioneForm
                    categorie={categorie}
                    catLoading={catLoading}
                    iniziale={modal?.mode === 'edit' ? modal.tx : null}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setModal(null)}
                />
            </Modal>
        </div>
    )
}

function Card({ label, value, color }) {
    return (
        <div style={S.card}>
            <div style={S.cardLabel}>{label}</div>
            <div style={{ ...S.cardValue, color }}>{value}</div>
        </div>
    )
}

// chip dei filtri attivi (versione compatta inline)
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
    if (filtri.dataDa) chips.push({ k: 'dd', label: `da ${filtri.dataDa}`, rm: () => set('dataDa', '') })
    if (filtri.dataA) chips.push({ k: 'da', label: `a ${filtri.dataA}`, rm: () => set('dataA', '') })

    return (
        <div style={S.chips}>
            {chips.map(c => (
                <span key={c.k} style={S.chip}>
                    {c.label}
                    <button onClick={c.rm} style={S.chipX}>✕</button>
                </span>
            ))}
        </div>
    )
}

const S = {
    app: { minHeight: '100vh', background: 'radial-gradient(circle at 30% 0%, rgba(233,69,96,.08), transparent 50%), radial-gradient(circle at 80% 100%, rgba(0,212,170,.06), transparent 50%), #0f0f1e', color: '#e6e6e6', fontFamily: 'system-ui, -apple-system, sans-serif', padding: 'clamp(1rem, 4vw, 3rem)', paddingBottom: '100px', boxSizing: 'border-box' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
    title: { margin: 0, fontSize: 28, fontWeight: 700 },
    userline: { margin: '4px 0 0', color: '#a0a0a0', fontSize: 13 },
    btnAdd: { padding: '8px 16px', background: 'linear-gradient(135deg, #e94560, #ff6b6b)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', lineHeight: 1.4 },
    btnGhost: { padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, color: '#e6e6e6', cursor: 'pointer', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', lineHeight: 1.4 },
    btnIcon: { background: 'transparent', backgroundColor: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontSize: 18, padding: 6, opacity: .7, borderRadius: 8, lineHeight: 1, WebkitAppearance: 'none', appearance: 'none' },
    monthBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e1e2f', borderRadius: 14, padding: '10px 16px', border: '1px solid rgba(255,255,255,.05)', marginBottom: 24 },
    monthNav: { width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', color: '#e6e6e6', cursor: 'pointer', fontSize: 14 },
    monthCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
    monthLabel: { fontSize: 18, fontWeight: 600 },
    monthToday: { fontSize: 11, color: '#e94560', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 },
    cards: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 },
    card: { background: '#1e1e2f', padding: '20px', borderRadius: 14, border: '1px solid rgba(255,255,255,.05)' },
    cardLabel: { color: '#a0a0a0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    cardValue: { fontSize: 24, fontWeight: 700, marginTop: 8 },
    budgetCard: { background: '#1e1e2f', padding: 20, borderRadius: 14, border: '1px solid rgba(255,255,255,.05)', marginBottom: 24 },
    budgetHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    budgetLabel: { color: '#a0a0a0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    budgetVal: { fontSize: 16, fontWeight: 600 },
    progress: { height: 8, background: 'rgba(255,255,255,.06)', borderRadius: 999, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 999, transition: 'width .3s' },
    budgetFoot: { marginTop: 8, fontSize: 12, color: '#a0a0a0' },
    section: { background: '#1e1e2f', padding: 24, borderRadius: 14, border: '1px solid rgba(255,255,255,.05)', marginBottom: 24 },
    listHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    h2: { margin: 0, fontSize: 18 },
    clearMini: { background: 'transparent', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, color: '#a0a0a0', cursor: 'pointer', fontSize: 12, padding: '4px 10px' },
    summary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#0f0f1e', borderRadius: 10, marginBottom: 12 },
    summaryCount: { color: '#e6e6e6', fontSize: 14, fontWeight: 500 },
    filteredTag: { color: '#e94560', fontSize: 12 },
    summaryAmts: { display: 'flex', gap: 12, fontSize: 14, fontWeight: 600 },
    chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 12px', background: 'rgba(233,69,96,.12)', border: '1px solid rgba(233,69,96,.3)', borderRadius: 999, color: '#e6e6e6', fontSize: 12 },
    chipX: { background: 'transparent', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: 12, padding: '0 4px', lineHeight: 1 },
    list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
    item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#0f0f1e', borderRadius: 10, border: '1px solid rgba(255,255,255,.04)' },
    itemLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    itemIcon: { fontSize: 22, width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 10 },
    itemTitle: { fontSize: 14, fontWeight: 500 },
    itemSub: { fontSize: 12, color: '#a0a0a0', marginTop: 2 },
    itemRight: { display: 'flex', alignItems: 'center', gap: 12 },
    amount: { fontWeight: 600, fontSize: 15 },
    muted: { color: '#a0a0a0', fontSize: 14, textAlign: 'center', padding: 20 },
    fab: { position: 'fixed', right: 'clamp(16px, 4vw, 32px)', bottom: 'clamp(16px, 4vw, 32px)', width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #e94560, #ff6b6b)', border: 'none', color: 'white', fontSize: 28, cursor: 'pointer', boxShadow: '0 6px 20px rgba(233,69,96,.45)', zIndex: 100, display: 'grid', placeItems: 'center', lineHeight: 1, transition: 'transform .15s' },
}