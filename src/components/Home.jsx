import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCategorie } from '../hooks/useCategorie'
import { useTransazioni } from '../hooks/useTransazioni'
import { formatEUR, formatData, oggiISO } from '../utils/format'

export default function Home() {
    const { user, signOut } = useAuth()
    const { categorie, loading: catLoading } = useCategorie()
    const { transazioni, loading: txLoading, aggiungi, modifica, elimina } = useTransazioni()

    // form state
    const [data, setData] = useState(oggiISO())
    const [importo, setImporto] = useState('')
    const [tipo, setTipo] = useState('spesa')
    const [categoriaId, setCategoriaId] = useState('')
    const [descrizione, setDescrizione] = useState('')
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState(null)

    // modalità modifica: se !== null, stiamo modificando la tx con questo id
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
        // scroll al form per UX
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
            if (editingId) {
                await modifica(editingId, payload)
            } else {
                await aggiungi(payload)
            }
            resetForm()
        } catch (err) {
            setFormError(err.message)
        } finally {
            setSaving(false)
        }
    }

    // totali del mese corrente
    const meseCorrente = oggiISO().slice(0, 7)
    const txMese = transazioni.filter(t => t.data.startsWith(meseCorrente))
    const totSpese = txMese.filter(t => t.tipo === 'spesa').reduce((s, t) => s + Number(t.importo), 0)
    const totEntrate = txMese.filter(t => t.tipo === 'entrata').reduce((s, t) => s + Number(t.importo), 0)
    const saldo = totEntrate - totSpese

    return (
        <div style={S.app}>
            <header style={S.header}>
                <div>
                    <h1 style={S.title}>💰 Expense Tracker</h1>
                    <p style={S.userline}>{user?.email}</p>
                </div>
                <button onClick={signOut} style={S.btnGhost}>Esci</button>
            </header>

            <section style={S.cards}>
                <Card label="Entrate del mese" value={formatEUR(totEntrate)} color="#00d4aa" />
                <Card label="Spese del mese" value={formatEUR(totSpese)} color="#ff6b6b" />
                <Card label="Saldo del mese" value={formatEUR(saldo)} color={saldo >= 0 ? '#00d4aa' : '#ff6b6b'} />
            </section>

            <section style={S.section}>
                <div style={S.sectionHead}>
                    <h2 style={S.h2}>
                        {editingId ? '✏️ Modifica transazione' : 'Nuova transazione'}
                    </h2>
                    {editingId && (
                        <button type="button" onClick={resetForm} style={S.btnGhost}>
                            Annulla
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} style={S.form}>
                    <div style={S.row}>
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

                    <div style={S.row}>
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

            <section style={S.section}>
                <h2 style={S.h2}>Ultime transazioni</h2>
                {txLoading ? (
                    <p style={S.muted}>Caricamento…</p>
                ) : transazioni.length === 0 ? (
                    <p style={S.muted}>Nessuna transazione. Aggiungine una qui sopra ☝️</p>
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
                                    <div style={S.itemIcon}>{t.categoria?.icona ?? '📄'}</div>
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
                                    <button
                                        onClick={() => avviaModifica(t)}
                                        style={S.btnIcon}
                                        title="Modifica"
                                    >✏️</button>
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
        padding: '2rem',
        maxWidth: 1100,
        margin: '0 auto',
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
    title: { margin: 0, fontSize: 28, fontWeight: 700 },
    userline: { margin: '4px 0 0', color: '#a0a0a0', fontSize: 13 },
    cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 },
    card: { background: '#1e1e2f', padding: '20px', borderRadius: 14, border: '1px solid rgba(255,255,255,.05)' },
    cardLabel: { color: '#a0a0a0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    cardValue: { fontSize: 24, fontWeight: 700, marginTop: 8 },
    section: { background: '#1e1e2f', padding: 24, borderRadius: 14, border: '1px solid rgba(255,255,255,.05)', marginBottom: 24 },
    sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    h2: { margin: 0, fontSize: 18 },
    form: { display: 'flex', flexDirection: 'column', gap: 12 },
    row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 },
    field: { display: 'flex', flexDirection: 'column', gap: 4 },
    fieldLabel: { color: '#a0a0a0', fontSize: 12 },
    input: { padding: '10px 12px', background: '#0f0f1e', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: '#e6e6e6', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
    btnPrimary: { marginTop: 8, padding: '12px', background: 'linear-gradient(135deg, #e94560, #ff6b6b)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
    btnGhost: { padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, color: '#e6e6e6', cursor: 'pointer', fontSize: 13 },
    btnIcon: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, opacity: .7 },
    list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
    item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#0f0f1e', borderRadius: 10, border: '1px solid rgba(255,255,255,.04)', transition: 'border-color .15s' },
    itemActive: { borderColor: '#e94560', boxShadow: '0 0 0 1px rgba(233,69,96,.3)' },
    itemLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    itemIcon: { fontSize: 24, width: 40, height: 40, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.04)', borderRadius: 10 },
    itemTitle: { fontSize: 14, fontWeight: 500 },
    itemSub: { fontSize: 12, color: '#a0a0a0', marginTop: 2 },
    itemRight: { display: 'flex', alignItems: 'center', gap: 12 },
    amount: { fontWeight: 600, fontSize: 15 },
    muted: { color: '#a0a0a0', fontSize: 14, textAlign: 'center', padding: 20 },
    error: { padding: '10px 12px', background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13 },
}