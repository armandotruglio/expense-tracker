import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCategorie } from '../hooks/useCategorie'
import { formatEUR } from '../utils/format'

// Emoji suggerite — l'utente può comunque incollare qualsiasi emoji
const EMOJI_SUGGERITE = ['🏠', '🛒', '🚗', '💡', '🎭', '🍕', '💊', '👕', '💻', '📦', '📌', '💵', '🌱', '🎬', '✈️', '🎁', '🐕', '📚', '💼', '⛽']
const COLORI_SUGGERITI = ['#ffb319', '#00d4aa', '#3b82f6', '#facc15', '#ec4899', '#e94560', '#a855f7', '#06b6d4', '#8b5cf6', '#94a3b8', '#10b981', '#f43f5e', '#84cc16', '#f97316']

const EMPTY_FORM = { nome: '', icona: '📦', colore: '#94a3b8', budget_mensile: '' }

export default function Categorie() {
    const { categorie, loading, aggiungi, modifica, elimina } = useCategorie()
    const [form, setForm] = useState(EMPTY_FORM)
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    function reset() {
        setForm(EMPTY_FORM)
        setEditingId(null)
        setError(null)
    }

    function avviaModifica(c) {
        setEditingId(c.id)
        setForm({
            nome: c.nome,
            icona: c.icona ?? '📦',
            colore: c.colore ?? '#94a3b8',
            budget_mensile: String(c.budget_mensile ?? 0),
        })
        setError(null)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        setSaving(true)
        try {
            const payload = {
                nome: form.nome.trim(),
                icona: form.icona,
                colore: form.colore,
                budget_mensile: parseFloat(form.budget_mensile) || 0,
            }
            if (editingId) await modifica(editingId, payload)
            else await aggiungi(payload)
            reset()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleElimina(c) {
        const conferma = confirm(
            `Eliminare "${c.nome}"?\n\n` +
            `Le transazioni collegate NON verranno eliminate, ma resteranno senza categoria.`
        )
        if (!conferma) return
        try { await elimina(c.id) }
        catch (err) { alert('Errore: ' + err.message) }
    }

    return (
        <div style={S.app}>
            <header style={S.header}>
                <div>
                    <h1 style={S.title}>🏷️ Categorie</h1>
                    <p style={S.subtitle}>{categorie.length} categorie · personalizza budget e aspetto</p>
                </div>
                <Link to="/" style={S.btnGhost}>← Torna alla home</Link>
            </header>

            {/* FORM */}
            <section style={S.section}>
                <div style={S.sectionHead}>
                    <h2 style={S.h2}>
                        {editingId ? '✏️ Modifica categoria' : '+ Nuova categoria'}
                    </h2>
                    {editingId && (
                        <button type="button" onClick={reset} style={S.btnGhost}>Annulla</button>
                    )}
                </div>

                <form onSubmit={handleSubmit} style={S.form}>
                    <div style={S.row} className="grid-row">
                        <Field label="Nome">
                            <input
                                type="text"
                                value={form.nome}
                                onChange={e => setForm({ ...form, nome: e.target.value })}
                                required
                                placeholder="es. Animali"
                                style={S.input}
                            />
                        </Field>
                        <Field label="Budget mensile (€)">
                            <input
                                type="number" step="0.01" min="0"
                                value={form.budget_mensile}
                                onChange={e => setForm({ ...form, budget_mensile: e.target.value })}
                                placeholder="0 = nessun budget"
                                style={S.input}
                            />
                        </Field>
                    </div>

                    <Field label="Icona">
                        <div style={S.pickerRow}>
                            <input
                                type="text"
                                value={form.icona}
                                onChange={e => setForm({ ...form, icona: e.target.value })}
                                maxLength={4}
                                style={{ ...S.input, width: 80, textAlign: 'center', fontSize: 20 }}
                            />
                            <div style={S.emojiList}>
                                {EMOJI_SUGGERITE.map(em => (
                                    <button
                                        key={em}
                                        type="button"
                                        onClick={() => setForm({ ...form, icona: em })}
                                        style={{
                                            ...S.emojiBtn,
                                            ...(form.icona === em ? S.emojiBtnActive : null),
                                        }}
                                    >{em}</button>
                                ))}
                            </div>
                        </div>
                    </Field>

                    <Field label="Colore">
                        <div style={S.pickerRow}>
                            <input
                                type="color"
                                value={form.colore}
                                onChange={e => setForm({ ...form, colore: e.target.value })}
                                style={S.colorInput}
                            />
                            <div style={S.colorList}>
                                {COLORI_SUGGERITI.map(col => (
                                    <button
                                        key={col}
                                        type="button"
                                        onClick={() => setForm({ ...form, colore: col })}
                                        style={{
                                            ...S.colorBtn,
                                            background: col,
                                            ...(form.colore === col ? S.colorBtnActive : null),
                                        }}
                                        title={col}
                                    />
                                ))}
                            </div>
                        </div>
                    </Field>

                    {/* anteprima */}
                    <div style={S.preview}>
                        <span style={S.previewLabel}>Anteprima:</span>
                        <div style={{ ...S.chip, borderColor: form.colore }}>
                            <span style={S.chipIcon}>{form.icona}</span>
                            <span>{form.nome || '(nome categoria)'}</span>
                            {parseFloat(form.budget_mensile) > 0 && (
                                <span style={S.chipBudget}>· {formatEUR(form.budget_mensile)}</span>
                            )}
                        </div>
                    </div>

                    {error && <div style={S.error}>{error}</div>}

                    <button type="submit" disabled={saving || !form.nome.trim()} style={S.btnPrimary}>
                        {saving
                            ? 'Salvataggio…'
                            : editingId
                                ? '💾 Salva modifiche'
                                : '+ Aggiungi categoria'}
                    </button>
                </form>
            </section>

            {/* LISTA */}
            <section style={S.section}>
                <h2 style={S.h2}>Categorie esistenti</h2>
                {loading ? (
                    <p style={S.muted}>Caricamento…</p>
                ) : (
                    <ul style={S.list}>
                        {categorie.map(c => (
                            <li
                                key={c.id}
                                style={{
                                    ...S.item,
                                    ...(editingId === c.id ? { borderColor: c.colore, boxShadow: `0 0 0 1px ${c.colore}55` } : null)
                                }}
                            >
                                <div style={S.itemLeft}>
                                    <div style={{ ...S.itemIcon, background: `${c.colore}22` }}>{c.icona}</div>
                                    <div>
                                        <div style={S.itemTitle}>{c.nome}</div>
                                        <div style={S.itemSub}>
                                            {c.budget_mensile > 0
                                                ? `Budget: ${formatEUR(c.budget_mensile)}/mese`
                                                : 'Nessun budget'}
                                        </div>
                                    </div>
                                </div>
                                <div style={S.itemRight}>
                                    <button onClick={() => avviaModifica(c)} style={S.btnIcon} title="Modifica">✏️</button>
                                    <button onClick={() => handleElimina(c)} style={S.btnIcon} title="Elimina">🗑️</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
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
    subtitle: { margin: '4px 0 0', color: '#a0a0a0', fontSize: 13 },
    section: { background: '#1e1e2f', padding: 24, borderRadius: 14, border: '1px solid rgba(255,255,255,.05)', marginBottom: 24 },
    sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    h2: { margin: 0, fontSize: 18 },
    form: { display: 'flex', flexDirection: 'column', gap: 16 },
    row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 },
    field: { display: 'flex', flexDirection: 'column', gap: 6 },
    fieldLabel: { color: '#a0a0a0', fontSize: 12 },
    input: { padding: '10px 12px', background: '#0f0f1e', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: '#e6e6e6', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
    pickerRow: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
    emojiList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    emojiBtn: { width: 36, height: 36, border: '1px solid rgba(255,255,255,.08)', background: '#0f0f1e', borderRadius: 8, cursor: 'pointer', fontSize: 18 },
    emojiBtnActive: { borderColor: '#e94560', background: 'rgba(233,69,96,.15)' },
    colorInput: { width: 50, height: 36, border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, background: 'transparent', cursor: 'pointer', padding: 2 },
    colorList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    colorBtn: { width: 28, height: 28, border: '2px solid transparent', borderRadius: '50%', cursor: 'pointer' },
    colorBtnActive: { borderColor: '#fff', transform: 'scale(1.1)' },
    preview: { display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#0f0f1e', borderRadius: 8, border: '1px dashed rgba(255,255,255,.08)' },
    previewLabel: { color: '#a0a0a0', fontSize: 12 },
    chip: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, border: '2px solid', background: 'rgba(255,255,255,.03)', fontSize: 14 },
    chipIcon: { fontSize: 18 },
    chipBudget: { color: '#a0a0a0', fontSize: 13 },
    btnPrimary: { padding: '12px', background: 'linear-gradient(135deg, #e94560, #ff6b6b)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
    btnGhost: { padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, color: '#e6e6e6', cursor: 'pointer', fontSize: 13, textDecoration: 'none', display: 'inline-block' },
    btnIcon: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4, opacity: .7 },
    list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
    item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#0f0f1e', borderRadius: 10, border: '1px solid rgba(255,255,255,.04)', transition: 'border-color .15s' },
    itemLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    itemIcon: { fontSize: 22, width: 40, height: 40, display: 'grid', placeItems: 'center', borderRadius: 10 },
    itemTitle: { fontSize: 14, fontWeight: 500 },
    itemSub: { fontSize: 12, color: '#a0a0a0', marginTop: 2 },
    itemRight: { display: 'flex', alignItems: 'center', gap: 8 },
    muted: { color: '#a0a0a0', fontSize: 14, textAlign: 'center', padding: 20 },
    error: { padding: '10px 12px', background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13 },
}