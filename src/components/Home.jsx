import GraficoSpese from './GraficoSpese'
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCategorie } from '../hooks/useCategorie'
import { useTransazioni } from '../hooks/useTransazioni'
import {
    formatEUR, formatData, oggiISO,
    meseISO, intervalloMese, meseLabel, mesePrec, meseSucc,
} from '../utils/format'


export default function Home() {
    const { user, signOut } = useAuth()
    const { categorie, loading: catLoading } = useCategorie()

    // mese selezionato (default: mese corrente)
    const [mese, setMese] = useState(meseISO())
    const { from, to } = useMemo(() => intervalloMese(mese), [mese])

    const { transazioni, loading: txLoading, aggiungi, modifica, elimina } =
        useTransazioni({ from, to })

    // form state
    const [data, setData] = useState(oggiISO())
    const [importo, setImporto] = useState('')
    const [tipo, setTipo] = useState('spesa')
    const [categoriaId, setCategoriaId] = useState('')
    const [descrizione, setDescrizione] = useState('')
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState(null)
    const [editingId, setEditingId] = useState(null)

    function resetForm() {
        setData(oggiISO())
        setImporto('')
        setTipo('spesa')
        setCategoriaId('')
        setDescrizione('')
        setEditingId(null)
        setFormError(null)
    }

    function avviaModifica(tx) {
        setEditingId(tx.id)
        setData(tx.data)
        setImporto(String(tx.importo))
        setTipo(tx.tipo)
        setCategoriaId(tx.categoria_id ?? '')
        setDescrizione(tx.descrizione ?? '')
        setFormError(null)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setFormError(null)
        setSaving(true)
        try {
            const payload = {
                data,
                importo: parseFloat(importo),
                tipo,
                categoria_id: categoriaId || null,
                descrizione: descrizione || null,
            }
            if (editingId) await modifica(editingId, payload)
            else await aggiungi(payload)
            resetForm()
        } catch (err) {
            setFormError(err.message)
        } finally {
            setSaving(false)
        }
    }

    // totali del mese selezionato (calcolati su tutte le tx caricate, che sono già del mese)
    const totSpese = transazioni.filter(t => t.tipo === 'spesa').reduce((s, t) => s + Number(t.importo), 0)
    const totEntrate = transazioni.filter(t => t.tipo === 'entrata').reduce((s, t) => s + Number(t.importo), 0)
    const saldo = totEntrate - totSpese

    // budget totale delle categorie e % spesa
    const budgetTotale = categorie.reduce((s, c) => s + Number(c.budget_mensile ?? 0), 0)
    const pctBudget = budgetTotale > 0 ? Math.min(100, (totSpese / budgetTotale) * 100) : 0

    const oggi = meseISO()
    const isMeseCorrente = mese === oggi

    return (
        <div style={S.app}>
            <header style={S.header}>
                <div>
                    <h1 style={S.title}>💰 Expense Tracker</h1>
                    <p style={S.userline}>{user?.email}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link to="/categorie" style={S.btnGhost}>🏷️ Categorie</Link>
                    <button onClick={signOut} style={S.btnGhost}>Esci</button>
                </div>
            </header>

            {/* SELETTORE MESE */}
            <section style={S.monthBar}>
                <button onClick={() => setMese(mesePrec(mese))} style={S.monthNav} aria-label="Mese precedente">◀</button>
                <div style={S.monthCenter}>
                    <div style={S.monthLabel}>{meseLabel(mese)}</div>
                    {!isMeseCorrente && (
                        <button onClick={() => setMese(oggi)} style={S.monthToday}>Vai a oggi</button>
                    )}
                </div>
                <button onClick={() => setMese(meseSucc(mese))} style={S.monthNav} aria-label="Mese successivo">▶</button>
            </section>

            {/* CARDS */}
            <section style={S.cards} className="grid-cards">
                <Card label="Entrate" value={formatEUR(totEntrate)} color="#00d4aa" />
                <Card label="Spese" value={formatEUR(totSpese)} color="#ff6b6b" />
                <Card label="Saldo" value={formatEUR(saldo)} color={saldo >= 0 ? '#00d4aa' : '#ff6b6b'} />
            </section>

            {/* PROGRESS BUDGET */}
            {budgetTotale > 0 && (
                <section style={S.budgetCard}>
                    <div style={S.budgetHead}>
                        <span style={S.budgetLabel}>Budget totale del mese</span>
                        <span style={S.budgetVal}>
                            {formatEUR(totSpese)} <span style={{ color: '#a0a0a0' }}>/ {formatEUR(budgetTotale)}</span>
                        </span>
                    </div>
                    <div style={S.progress}>
                        <div style={{
                            ...S.progressBar,
                            width: `${pctBudget}%`,
                            background: pctBudget >= 100 ? '#ff6b6b' : pctBudget >= 80 ? '#ffb319' : '#00d4aa',
                        }} />
                    </div>
                    <div style={S.budgetFoot}>
                        {pctBudget >= 100
                            ? `⚠️ Hai superato il budget di ${formatEUR(totSpese - budgetTotale)}`
                            : `Restano ${formatEUR(budgetTotale - totSpese)} (${(100 - pctBudget).toFixed(0)}%)`}
                    </div>
                </section>
            )}

            <GraficoSpese transazioni={transazioni} categorie={categorie} />

            {/* FORM */}
            <section style={S.section}>
                <div style={S.sectionHead}>
                    <h2 style={S.h2}>
                        {editingId ? '✏️ Modifica transazione' : 'Nuova transazione'}
                    </h2>
                    {editingId && (
                        <button type="button" onClick={resetForm} style={S.btnGhost}>Annulla</button>
                    )}
                </div>

                <form onSubmit={handleSubmit} style={S.form}>
                    <div style={S.row} className="grid-row">
                        <Field label="Data">
                            <input type="date" value={data} onChange={e => setData(e.target.value)} required style={S.input} />
                        </Field>
                        <Field label="Importo (€)">
                            <input type="number" step="0.01" min="0" value={importo} onChange={e => setImporto(e.target.value)} required placeholder="0,00" style={S.input} />
                        </Field>
                        <Field label="Tipo">
                            <select value={tipo} onChange={e => setTipo(e.target.value)} style={S.input}>
                                <option value="spesa">Spesa</option>
                                <option value="entrata">Entrata</option>
                            </select>
                        </Field>
                    </div>

                    <div style={S.row} className="grid-row">
                        <Field label="Categoria">
                            <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={S.input}>
                                <option value="">— nessuna —</option>
                                {catLoading
                                    ? <option>Caricamento…</option>
                                    : categorie.map(c => (
                                        <option key={c.id} value={c.id}>{c.icona} {c.nome}</option>
                                    ))}
                            </select>
                        </Field>
                        <Field label="Descrizione">
                            <input type="text" value={descrizione} onChange={e => setDescrizione(e.target.value)} placeholder="es. Spesa Esselunga" style={S.input} />
                        </Field>
                    </div>

                    {formError && <div style={S.error}>{formError}</div>}

                    <button type="submit" disabled={saving} style={S.btnPrimary}>
                        {saving
                            ? 'Salvataggio…'
                            : editingId
                                ? '💾 Salva modifiche'
                                : '+ Aggiungi transazione'}
                    </button>
                </form>
            </section>

            {/* LISTA */}
            <section style={S.section}>
                <div style={S.sectionHead}>
                    <h2 style={S.h2}>Transazioni di {meseLabel(mese)}</h2>
                    <span style={S.countBadge}>{transazioni.length}</span>
                </div>

                {txLoading ? (
                    <p style={S.muted}>Caricamento…</p>
                ) : transazioni.length === 0 ? (
                    <p style={S.muted}>Nessuna transazione in questo mese</p>
                ) : (
                    <ul style={S.list}>
                        {transazioni.map(t => (
                            <li
                                key={t.id}
                                style={{
                                    ...S.item,
                                    ...(editingId === t.id ? S.itemActive : null),
                                }}
                            >
                                <div style={S.itemLeft}>
                                    <div style={{
                                        ...S.itemIcon,
                                        background: t.categoria?.colore ? `${t.categoria.colore}22` : 'rgba(255,255,255,.04)',
                                    }}>
                                        {t.categoria?.icona ?? '📄'}
                                    </div>
                                    <div>
                                        <div style={S.itemTitle}>
                                            {t.descrizione || t.categoria?.nome || '(senza descrizione)'}
                                        </div>
                                        <div style={S.itemSub}>
                                            {formatData(t.data)} · {t.categoria?.nome ?? 'senza categoria'}
                                        </div>
                                    </div>
                                </div>
                                <div style={S.itemRight}>
                                    <div style={{
                                        ...S.amount,
                                        color: t.tipo === 'spesa' ? '#ff6b6b' : '#00d4aa'
                                    }}>
                                        {t.tipo === 'spesa' ? '−' : '+'}{formatEUR(t.importo)}
                                    </div>
                                    <button onClick={() => avviaModifica(t)} style={S.btnIcon} title="Modifica">✏️</button>
                                    <button
                                        onClick={() => { if (confirm('Eliminare questa transazione?')) elimina(t.id) }}
                                        style={S.btnIcon}
                                        title="Elimina"
                                    >🗑️</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
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

function Field({ label, children }) {
    return (
        <label style={S.field}>
            <span style={S.fieldLabel}>{label}</span>
            {children}
        </label>
    )
}

const S = {
    app: {
        minHeight: '100vh',
        background: 'radial-gradient(circle at 30% 0%, rgba(233,69,96,.08), transparent 50%), radial-gradient(circle at 80% 100%, rgba(0,212,170,.06), transparent 50%), #0f0f1e',
        color: '#e6e6e6',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: 'clamp(1rem, 3vw, 2.5rem)',
        margin: '0 auto',
        boxSizing: 'border-box',
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
    title: { margin: 0, fontSize: 28, fontWeight: 700 },
    userline: { margin: '4px 0 0', color: '#a0a0a0', fontSize: 13 },

    monthBar: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#1e1e2f', borderRadius: 14, padding: '10px 16px',
        border: '1px solid rgba(255,255,255,.05)', marginBottom: 24,
    },
    monthNav: {
        width: 40, height: 40, borderRadius: 10,
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
        color: '#e6e6e6', cursor: 'pointer', fontSize: 14,
    },
    monthCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
    monthLabel: { fontSize: 18, fontWeight: 600 },
    monthToday: {
        fontSize: 11, color: '#e94560', background: 'transparent',
        border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0,
    },

    cards: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 },
    card: { background: '#1e1e2f', padding: '20px', borderRadius: 14, border: '1px solid rgba(255,255,255,.05)' },
    cardLabel: { color: '#a0a0a0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    cardValue: { fontSize: 24, fontWeight: 700, marginTop: 8 },

    budgetCard: {
        background: '#1e1e2f', padding: 20, borderRadius: 14,
        border: '1px solid rgba(255,255,255,.05)', marginBottom: 24,
    },
    budgetHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    budgetLabel: { color: '#a0a0a0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    budgetVal: { fontSize: 16, fontWeight: 600 },
    progress: { height: 8, background: 'rgba(255,255,255,.06)', borderRadius: 999, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 999, transition: 'width .3s' },
    budgetFoot: { marginTop: 8, fontSize: 12, color: '#a0a0a0' },

    section: { background: '#1e1e2f', padding: 24, borderRadius: 14, border: '1px solid rgba(255,255,255,.05)', marginBottom: 24 },
    sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    h2: { margin: 0, fontSize: 18 },
    countBadge: { background: 'rgba(255,255,255,.06)', padding: '2px 10px', borderRadius: 999, fontSize: 12, color: '#a0a0a0' },
    form: { display: 'flex', flexDirection: 'column', gap: 12 },
    row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 },
    field: { display: 'flex', flexDirection: 'column', gap: 4 },
    fieldLabel: { color: '#a0a0a0', fontSize: 12 },
    input: { padding: '10px 12px', background: '#0f0f1e', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: '#e6e6e6', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
    btnPrimary: { marginTop: 8, padding: '12px', background: 'linear-gradient(135deg, #e94560, #ff6b6b)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
    btnGhost: { padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, color: '#e6e6e6', cursor: 'pointer', fontSize: 13, textDecoration: 'none', display: 'inline-block' },
    btnIcon: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, opacity: .7 },
    list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
    item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#0f0f1e', borderRadius: 10, border: '1px solid rgba(255,255,255,.04)', transition: 'border-color .15s' },
    itemActive: { borderColor: '#e94560', boxShadow: '0 0 0 1px rgba(233,69,96,.3)' },
    itemLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    itemIcon: { fontSize: 22, width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 10 },
    itemTitle: { fontSize: 14, fontWeight: 500 },
    itemSub: { fontSize: 12, color: '#a0a0a0', marginTop: 2 },
    itemRight: { display: 'flex', alignItems: 'center', gap: 12 },
    amount: { fontWeight: 600, fontSize: 15 },
    muted: { color: '#a0a0a0', fontSize: 14, textAlign: 'center', padding: 20 },
    error: { padding: '10px 12px', background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13 },
}