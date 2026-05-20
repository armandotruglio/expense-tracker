import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCategorie } from '../hooks/useCategorie'
import { formatEUR } from '../utils/format'
import Modal from './Modal'
import ConfirmDialog from './ConfirmDialog'

const EMOJI_SUGGERITE = ['🏠', '🛒', '🚗', '💡', '🎭', '🍕', '💊', '👕', '💻', '📦', '📌', '💵', '🌱', '🎬', '✈️', '🎁', '🐕', '📚', '💼', '⛽']
const COLORI_SUGGERITI = ['#ffb319', '#00d4aa', '#3b82f6', '#facc15', '#ec4899', '#e94560', '#a855f7', '#06b6d4', '#8b5cf6', '#94a3b8', '#10b981', '#f43f5e', '#84cc16', '#f97316']

const EMPTY_FORM = { nome: '', icona: '📦', colore: '#94a3b8', budget_mensile: '' }

export default function Categorie() {
    const { categorie, loading, aggiungi, modifica, elimina } = useCategorie()
    const [modal, setModal] = useState(null) // null | { id?: number } (null = chiuso, {} = nuova, {id} = modifica)
    const [toDelete, setToDelete] = useState(null)
    const [deleteError, setDeleteError] = useState(null)

    function apriNuova() {
        setModal({ form: EMPTY_FORM })
    }

    function apriModifica(c) {
        setModal({
            id: c.id,
            form: {
                nome: c.nome,
                icona: c.icona ?? '📦',
                colore: c.colore ?? '#94a3b8',
                budget_mensile: String(c.budget_mensile ?? 0),
            },
        })
    }

    async function handleSubmit(payload) {
        if (modal?.id) await modifica(modal.id, payload)
        else await aggiungi(payload)
        setModal(null)
    }

    async function handleConfirmDelete() {
        if (!toDelete) return
        try {
            await elimina(toDelete.id)
            setToDelete(null)
        } catch (err) {
            setDeleteError(err.message)
        }
    }

    return (
        <div style={S.app}>
            <header style={S.header}>
                <div style={{ minWidth: 0 }}>
                    <h1 style={S.title}>🏷️ Categorie</h1>
                    <p style={S.subtitle}>
                        {categorie.length} {categorie.length === 1 ? 'categoria' : 'categorie'} · personalizza budget e aspetto
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <Link
                        to="/"
                        style={S.btnGhost}
                        className="ix-btn-ghost"
                        aria-label="Torna alla home"
                    >
                        <span aria-hidden="true">←</span>
                        <span className="hide-mobile">Home</span>
                    </Link>
                    <button
                        onClick={apriNuova}
                        style={S.btnPrimary}
                        className="ix-btn-primary"
                    >
                        + Nuova<span className="hide-mobile"> categoria</span>
                    </button>
                </div>
            </header>

            <section style={S.section}>
                <h2 style={S.h2}>Categorie esistenti</h2>
                {loading ? (
                    <p style={S.muted}>Caricamento…</p>
                ) : categorie.length === 0 ? (
                    <div style={S.empty}>
                        <div style={S.emptyIcon} aria-hidden="true">📭</div>
                        <div style={S.emptyTitle}>Nessuna categoria</div>
                        <div style={S.emptyMsg}>Crea la prima categoria per organizzare le tue transazioni.</div>
                        <button onClick={apriNuova} style={S.emptyBtn} className="ix-btn-primary">
                            + Crea categoria
                        </button>
                    </div>
                ) : (
                    <ul style={S.list}>
                        {categorie.map(c => (
                            <li
                                key={c.id}
                                style={S.item}
                                className="ix-item"
                            >
                                <div style={S.itemLeft}>
                                    <div style={{ ...S.itemIcon, background: `${c.colore}22` }}>
                                        <span aria-hidden="true">{c.icona}</span>
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={S.itemTitle}>{c.nome}</div>
                                        <div style={S.itemSub}>
                                            {c.budget_mensile > 0
                                                ? `Budget: ${formatEUR(c.budget_mensile)}/mese`
                                                : 'Nessun budget'}
                                        </div>
                                    </div>
                                </div>
                                <div style={S.itemRight}>
                                    <button
                                        onClick={() => apriModifica(c)}
                                        style={S.btnIcon}
                                        className="ix-btn-icon"
                                        aria-label={`Modifica categoria ${c.nome}`}
                                    >
                                        <span aria-hidden="true">✏️</span>
                                    </button>
                                    <button
                                        onClick={() => { setDeleteError(null); setToDelete(c) }}
                                        style={S.btnIcon}
                                        className="ix-btn-icon"
                                        aria-label={`Elimina categoria ${c.nome}`}
                                    >
                                        <span aria-hidden="true">🗑️</span>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <Modal
                open={modal !== null}
                onClose={() => setModal(null)}
                title={modal?.id ? '✏️ Modifica categoria' : '+ Nuova categoria'}
            >
                {modal && (
                    <CategoriaForm
                        iniziale={modal.form}
                        onSubmit={handleSubmit}
                        onCancel={() => setModal(null)}
                    />
                )}
            </Modal>

            <ConfirmDialog
                open={toDelete !== null}
                title="Eliminare categoria?"
                message={toDelete
                    ? `Stai per eliminare "${toDelete.nome}".\n\nLe transazioni collegate NON verranno eliminate, ma resteranno senza categoria.`
                    : ''}
                confirmLabel="Elimina"
                danger
                onConfirm={handleConfirmDelete}
                onCancel={() => { setToDelete(null); setDeleteError(null) }}
            />

            {deleteError && (
                <div style={S.toast} role="alert">
                    Errore: {deleteError}
                </div>
            )}
        </div>
    )
}

function CategoriaForm({ iniziale, onSubmit, onCancel }) {
    const [form, setForm] = useState(iniziale)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        setSaving(true)
        try {
            await onSubmit({
                nome: form.nome.trim(),
                icona: form.icona,
                colore: form.colore,
                budget_mensile: parseFloat(form.budget_mensile) || 0,
            })
        } catch (err) {
            setError(err.message)
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} style={F.form}>
            <div style={F.row} className="grid-row">
                <label style={F.field}>
                    <span style={F.lbl}>Nome</span>
                    <input
                        type="text"
                        value={form.nome}
                        onChange={e => setForm({ ...form, nome: e.target.value })}
                        required
                        placeholder="es. Animali"
                        style={F.input}
                        autoFocus
                        maxLength={50}
                    />
                </label>
                <label style={F.field}>
                    <span style={F.lbl}>Budget mensile (€)</span>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={form.budget_mensile}
                        onChange={e => setForm({ ...form, budget_mensile: e.target.value })}
                        placeholder="0 = nessun budget"
                        style={F.input}
                    />
                </label>
            </div>

            <div style={F.field}>
                <span style={F.lbl}>Icona</span>
                <div style={F.pickerRow}>
                    <input
                        type="text"
                        value={form.icona}
                        onChange={e => setForm({ ...form, icona: e.target.value })}
                        maxLength={4}
                        style={{ ...F.input, width: 80, textAlign: 'center', fontSize: 22 }}
                        aria-label="Icona personalizzata"
                    />
                    <div style={F.emojiList} role="radiogroup" aria-label="Icone suggerite">
                        {EMOJI_SUGGERITE.map(em => (
                            <button
                                key={em}
                                type="button"
                                role="radio"
                                aria-checked={form.icona === em}
                                aria-label={`Seleziona icona ${em}`}
                                onClick={() => setForm({ ...form, icona: em })}
                                style={{
                                    ...F.emojiBtn,
                                    ...(form.icona === em ? F.emojiBtnActive : null),
                                }}
                            >
                                {em}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={F.field}>
                <span style={F.lbl}>Colore</span>
                <div style={F.pickerRow}>
                    <input
                        type="color"
                        value={form.colore}
                        onChange={e => setForm({ ...form, colore: e.target.value })}
                        style={F.colorInput}
                        aria-label="Colore personalizzato"
                    />
                    <div style={F.colorList} role="radiogroup" aria-label="Colori suggeriti">
                        {COLORI_SUGGERITI.map(col => (
                            <button
                                key={col}
                                type="button"
                                role="radio"
                                aria-checked={form.colore === col}
                                aria-label={`Seleziona colore ${col}`}
                                onClick={() => setForm({ ...form, colore: col })}
                                style={{
                                    ...F.colorBtn,
                                    background: col,
                                    ...(form.colore === col ? F.colorBtnActive : null),
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Anteprima */}
            <div style={F.preview}>
                <span style={F.previewLabel}>Anteprima</span>
                <div style={{ ...F.chip, borderColor: form.colore }}>
                    <span style={F.chipIcon}>{form.icona}</span>
                    <span>{form.nome || '(nome categoria)'}</span>
                    {parseFloat(form.budget_mensile) > 0 && (
                        <span style={F.chipBudget}>· {formatEUR(form.budget_mensile)}</span>
                    )}
                </div>
            </div>

            {error && <div role="alert" style={F.error}>{error}</div>}

            <div style={F.actions}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={F.btnGhost}
                    className="ix-btn-ghost"
                >
                    Annulla
                </button>
                <button
                    type="submit"
                    disabled={saving || !form.nome.trim()}
                    style={F.btnPrimary}
                    className="ix-btn-primary"
                >
                    {saving ? 'Salvataggio…' : '💾 Salva'}
                </button>
            </div>
        </form>
    )
}

const S = {
    app: {
        minHeight: '100vh',
        background: 'var(--grad-bg)',
        color: 'var(--text)',
        padding: 'clamp(1rem, 4vw, 2rem)',
        paddingTop: 'calc(clamp(1rem, 4vw, 2rem) + var(--safe-top))',
        paddingBottom: 'calc(2rem + var(--safe-bottom))',
        maxWidth: 1100,
        margin: '0 auto',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    title: { margin: 0, fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700 },
    subtitle: { margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 },
    section: {
        background: 'var(--surface)',
        padding: 24,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
    },
    h2: { margin: '0 0 16px 0', fontSize: 18 },
    btnPrimary: {
        padding: '10px 16px',
        background: 'var(--grad-accent)',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        color: 'white',
        fontSize: 13,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
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
        minHeight: 38,
    },
    btnIcon: {
        background: 'transparent',
        border: 'none',
        fontSize: 18,
        padding: 8,
        opacity: .7,
        borderRadius: 'var(--radius-sm)',
        minWidth: 36,
        minHeight: 36,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
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
    itemSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
    itemRight: { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 },
    muted: { color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 20 },
    empty: { textAlign: 'center', padding: '32px 20px' },
    emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.6 },
    emptyTitle: { fontSize: 16, fontWeight: 600, marginBottom: 6 },
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
    toast: {
        position: 'fixed',
        bottom: 'calc(16px + var(--safe-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--danger-soft)',
        border: '1px solid var(--danger-ring)',
        color: 'var(--danger)',
        padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        fontSize: 13,
        boxShadow: 'var(--shadow-md)',
        zIndex: 1100,
    },
}

const F = {
    form: { display: 'flex', flexDirection: 'column', gap: 14 },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    field: { display: 'flex', flexDirection: 'column', gap: 6 },
    lbl: { color: 'var(--text-muted)', fontSize: 12 },
    input: {
        padding: '10px 12px',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text)',
        fontSize: 14,
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'border-color var(--t-fast), box-shadow var(--t-fast)',
    },
    pickerRow: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
    emojiList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    emojiBtn: {
        width: 38,
        height: 38,
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 18,
        transition: 'background-color var(--t-fast), border-color var(--t-fast)',
    },
    emojiBtnActive: { borderColor: 'var(--accent)', background: 'var(--accent-soft)' },
    colorInput: {
        width: 50,
        height: 38,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        padding: 2,
    },
    colorList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    colorBtn: {
        width: 30,
        height: 30,
        border: '2px solid transparent',
        borderRadius: '50%',
        transition: 'transform var(--t-fast), border-color var(--t-fast)',
    },
    colorBtnActive: { borderColor: '#fff', transform: 'scale(1.1)' },
    preview: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        background: 'var(--bg)',
        borderRadius: 'var(--radius-sm)',
        border: '1px dashed var(--border)',
        flexWrap: 'wrap',
    },
    previewLabel: { color: 'var(--text-muted)', fontSize: 12 },
    chip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 'var(--radius-pill)',
        border: '2px solid',
        background: 'rgba(255,255,255,.03)',
        fontSize: 14,
    },
    chipIcon: { fontSize: 18 },
    chipBudget: { color: 'var(--text-muted)', fontSize: 13 },
    error: {
        padding: '10px 12px',
        background: 'var(--danger-soft)',
        border: '1px solid var(--danger-ring)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--danger)',
        fontSize: 13,
    },
    actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
    btnGhost: {
        padding: '10px 18px',
        background: 'transparent',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text)',
        fontSize: 14,
    },
    btnPrimary: {
        padding: '10px 18px',
        background: 'var(--grad-accent)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        fontWeight: 600,
        fontSize: 14,
    },
}
