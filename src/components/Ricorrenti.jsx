import { useMemo, useState } from 'react'
import { useCategorie } from '../hooks/useCategorie'
import { useTransazioni } from '../hooks/useTransazioni'
import { useRicorrenti } from '../hooks/useRicorrenti'
import { meseISO, intervalloMese, meseLabel, formatEUR } from '../utils/format'
import Modal from './Modal'
import ConfirmDialog from './ConfirmDialog'
import { useToast } from '../hooks/useToast'

const EMPTY = { nome: '', importo: '', tipo: 'spesa', categoria_id: '', giorno: 1 }

export default function Ricorrenti() {
    const { categorie } = useCategorie()
    const { ricorrenti, loading, aggiungi, modifica, elimina, segnaApplicato } = useRicorrenti()
    const toast = useToast()

    const [mese] = useState(meseISO())
    const { from, to } = useMemo(() => intervalloMese(mese), [mese])
    const { aggiungi: aggiungiTx } = useTransazioni({ from, to })

    const [modal, setModal] = useState(null) // { id?, form }
    const [toDelete, setToDelete] = useState(null)
    const [applyState, setApplyState] = useState({}) // {id: 'pending'|'done'|'error'}

    function apriNuova() { setModal({ form: EMPTY }) }
    function apriModifica(r) {
        setModal({
            id: r.id,
            form: {
                nome: r.nome,
                importo: String(r.importo),
                tipo: r.tipo,
                categoria_id: r.categoria_id ?? '',
                giorno: r.giorno,
            },
        })
    }

    async function handleSubmit(payload) {
        const data = {
            nome: payload.nome.trim(),
            importo: parseFloat(payload.importo),
            tipo: payload.tipo,
            categoria_id: payload.categoria_id ? Number(payload.categoria_id) : null,
            giorno: Math.min(31, Math.max(1, parseInt(payload.giorno, 10) || 1)),
        }
        if (modal?.id) await modifica(modal.id, data)
        else await aggiungi(data)
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

    async function applicaAlMese(r) {
        setApplyState(s => ({ ...s, [r.id]: 'pending' }))
        try {
            const [y, m] = mese.split('-').map(Number)
            const lastDay = new Date(y, m, 0).getDate()
            const giorno = Math.min(r.giorno, lastDay)
            const dataISO = `${mese}-${String(giorno).padStart(2, '0')}`

            await aggiungiTx({
                data: dataISO,
                importo: r.importo,
                tipo: r.tipo,
                categoria_id: r.categoria_id,
                descrizione: r.nome,
            })
            segnaApplicato(r.id, mese)
            setApplyState(s => ({ ...s, [r.id]: 'done' }))
            setTimeout(() => setApplyState(s => {
                const next = { ...s }
                delete next[r.id]
                return next
            }), 2500)
        } catch (err) {
            setApplyState(s => ({ ...s, [r.id]: 'error' }))
            toast.error(err?.message ?? `Errore applicando "${r.nome}"`)
        }
    }

    const totMensile = ricorrenti.reduce(
        (s, r) => s + (r.tipo === 'spesa' ? -1 : 1) * r.importo, 0
    )

    return (
        <div>
            <div style={S.header}>
                <div style={{ minWidth: 0 }}>
                    <div style={S.eyebrow}>Risparmia tempo</div>
                    <h1 style={S.title}>⟳ Transazioni ricorrenti</h1>
                    <p style={S.subtitle}>
                        Modelli che puoi applicare al mese con un click — affitto, stipendio, abbonamenti.
                    </p>
                </div>
                <button onClick={apriNuova} style={S.btnPrimary} className="ix-btn-primary">
                    + Nuova ricorrenza
                </button>
            </div>

            {ricorrenti.length > 0 && (
                <div style={S.summary}>
                    <div>
                        <div style={S.summaryLbl}>Saldo mensile teorico</div>
                        <div style={{
                            ...S.summaryVal,
                            color: totMensile >= 0 ? 'var(--success)' : 'var(--accent)',
                        }} className="num">
                            {totMensile >= 0 ? '+' : ''}{formatEUR(totMensile)}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={S.summaryLbl}>Mese corrente</div>
                        <div style={S.summaryMonth}>{meseLabel(mese)}</div>
                    </div>
                </div>
            )}

            <div style={S.section}>
                {loading ? (
                    <p style={S.muted}>Caricamento…</p>
                ) : ricorrenti.length === 0 ? (
                    <div style={S.empty}>
                        <div style={S.emptyIcon} aria-hidden="true">⟳</div>
                        <div style={S.emptyTitle}>Nessuna ricorrenza</div>
                        <div style={S.emptyMsg}>
                            Crea modelli per le tue transazioni periodiche (stipendio, affitto,
                            abbonamenti…) e applicale al mese con un click.
                        </div>
                        <button onClick={apriNuova} style={S.btnPrimary} className="ix-btn-primary">
                            + Crea la prima
                        </button>
                    </div>
                ) : (
                    <ul style={S.list}>
                        {ricorrenti.map(r => {
                            const cat = categorie.find(c => c.id === r.categoria_id)
                            const giaApplicato = r.ultimaApplicazione === mese
                            const stato = applyState[r.id]
                            return (
                                <li key={r.id} style={S.item} className="ix-item">
                                    <div style={S.itemLeft}>
                                        <div style={{
                                            ...S.itemIcon,
                                            background: r.tipo === 'spesa' ? 'var(--rose-soft)' : 'var(--success-soft)',
                                        }} aria-hidden="true">
                                            {cat?.icona ?? (r.tipo === 'spesa' ? '−' : '+')}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={S.itemTitle}>{r.nome}</div>
                                            <div style={S.itemSub}>
                                                Ogni mese il <b>giorno {r.giorno}</b>
                                                {cat ? ` · ${cat.nome}` : ''}
                                                {giaApplicato && <span style={S.tagDone}> · applicato a {meseLabel(mese)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={S.itemRight}>
                                        <div style={{
                                            ...S.amount,
                                            color: r.tipo === 'spesa' ? 'var(--accent)' : 'var(--success)',
                                        }} className="num">
                                            {r.tipo === 'spesa' ? '−' : '+'}{formatEUR(r.importo)}
                                        </div>
                                        <button
                                            onClick={() => applicaAlMese(r)}
                                            disabled={stato === 'pending' || giaApplicato}
                                            style={{
                                                ...S.btnApply,
                                                ...(giaApplicato || stato === 'done' ? S.btnApplyDone : null),
                                            }}
                                            className="ix-btn-ghost"
                                            title="Crea la transazione di questo mese"
                                        >
                                            {stato === 'pending' ? '…' : stato === 'done' || giaApplicato ? '✓ Applicata' : 'Applica'}
                                        </button>
                                        <button
                                            onClick={() => apriModifica(r)}
                                            style={S.btnIcon}
                                            className="ix-btn-icon"
                                            aria-label={`Modifica ricorrenza ${r.nome}`}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => setToDelete(r)}
                                            style={S.btnIcon}
                                            className="ix-btn-icon"
                                            aria-label={`Elimina ricorrenza ${r.nome}`}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>

            <p style={S.disclaimer}>
                Le ricorrenze sono salvate sul questo dispositivo (storage locale).
                Quando le applichi a un mese, vengono inserite nel database come normali transazioni.
            </p>

            <Modal
                open={modal !== null}
                onClose={() => setModal(null)}
                title={modal?.id ? '✏️ Modifica ricorrenza' : '+ Nuova ricorrenza'}
            >
                {modal && (
                    <RicorrenteForm
                        iniziale={modal.form}
                        categorie={categorie}
                        onSubmit={handleSubmit}
                        onCancel={() => setModal(null)}
                    />
                )}
            </Modal>

            <ConfirmDialog
                open={toDelete !== null}
                title="Eliminare ricorrenza?"
                message={toDelete
                    ? `Stai per eliminare "${toDelete.nome}".\n\nLe transazioni già applicate ai mesi precedenti restano.`
                    : ''}
                confirmLabel="Elimina"
                danger
                onConfirm={handleConfirmDelete}
                onCancel={() => setToDelete(null)}
            />
        </div>
    )
}

function RicorrenteForm({ iniziale, categorie, onSubmit, onCancel }) {
    const [form, setForm] = useState(iniziale)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const isSpesa = form.tipo === 'spesa'

    async function submit(e) {
        e.preventDefault()
        setError(null)
        setSaving(true)
        try {
            await onSubmit(form)
        } catch (err) {
            setError(err.message)
            setSaving(false)
        }
    }

    return (
        <form onSubmit={submit} style={F.form}>
            <div style={F.field}>
                <span style={F.lbl}>Tipo</span>
                <div style={F.seg} role="radiogroup" aria-label="Tipo">
                    <button
                        type="button"
                        role="radio"
                        aria-checked={isSpesa}
                        onClick={() => setForm({ ...form, tipo: 'spesa' })}
                        style={{ ...F.segBtn, ...(isSpesa ? F.segSpesa : null) }}
                    >
                        − Spesa
                    </button>
                    <button
                        type="button"
                        role="radio"
                        aria-checked={!isSpesa}
                        onClick={() => setForm({ ...form, tipo: 'entrata' })}
                        style={{ ...F.segBtn, ...(!isSpesa ? F.segEntrata : null) }}
                    >
                        + Entrata
                    </button>
                </div>
            </div>

            <label style={F.field}>
                <span style={F.lbl}>Nome</span>
                <input
                    type="text"
                    value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })}
                    required
                    placeholder="es. Affitto, Stipendio, Netflix"
                    style={F.input}
                    autoFocus
                    maxLength={60}
                />
            </label>

            <div style={F.row} className="grid-row-2">
                <label style={F.field}>
                    <span style={F.lbl}>Importo (€)</span>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={form.importo}
                        onChange={e => setForm({ ...form, importo: e.target.value })}
                        required
                        placeholder="0,00"
                        style={F.input}
                    />
                </label>
                <label style={F.field}>
                    <span style={F.lbl}>Giorno del mese</span>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        value={form.giorno}
                        onChange={e => setForm({ ...form, giorno: e.target.value })}
                        required
                        style={F.input}
                    />
                </label>
            </div>

            <label style={F.field}>
                <span style={F.lbl}>Categoria</span>
                <select
                    value={form.categoria_id}
                    onChange={e => setForm({ ...form, categoria_id: e.target.value })}
                    style={F.input}
                >
                    <option value="">— nessuna —</option>
                    {categorie.map(c => (
                        <option key={c.id} value={c.id}>{c.icona} {c.nome}</option>
                    ))}
                </select>
            </label>

            {error && <div role="alert" style={F.error}>{error}</div>}

            <div style={F.actions}>
                <button type="button" onClick={onCancel} style={F.btnGhost} className="ix-btn-ghost">
                    Annulla
                </button>
                <button
                    type="submit"
                    disabled={saving || !form.nome.trim() || !form.importo}
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
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 28,
        padding: '0 18px',
        gap: 16,
        flexWrap: 'wrap',
    },
    eyebrow: {
        fontFamily: 'var(--font-hand)',
        fontSize: 18,
        color: 'var(--lavender)',
        fontWeight: 600,
        lineHeight: 1,
    },
    title: {
        margin: '4px 0 0',
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(26px, 4vw, 32px)',
        fontWeight: 500,
        letterSpacing: '-0.02em',
    },
    subtitle: { margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13.5, maxWidth: 460 },
    summary: {
        margin: '0 18px 20px',
        padding: '14px 18px',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    summaryLbl: { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 },
    summaryVal: { fontSize: 20, fontWeight: 800, marginTop: 4 },
    summaryMonth: { fontSize: 14, fontWeight: 600, marginTop: 4, color: 'var(--text-2)' },
    section: {
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--line)',
        margin: '0 18px',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
    },
    btnPrimary: {
        padding: '10px 18px',
        background: 'var(--grad-hero)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        fontSize: 13,
        fontWeight: 700,
        boxShadow: 'var(--shadow-coral)',
    },
    btnApply: {
        background: 'var(--surface)',
        border: '1px solid var(--line-2)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--accent)',
        padding: '7px 12px',
        fontSize: 12.5,
        fontWeight: 700,
        cursor: 'pointer',
    },
    btnApplyDone: {
        background: 'var(--success-soft)',
        borderColor: 'var(--success-ring)',
        color: 'var(--success)',
    },
    btnIcon: {
        background: 'transparent',
        border: 'none',
        fontSize: 16,
        width: 32, height: 32,
        opacity: 0.7,
        borderRadius: 'var(--radius-sm)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: { listStyle: 'none', padding: 0, margin: 0 },
    item: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 18px',
        borderBottom: '1px solid var(--line)',
        gap: 12,
        background: 'var(--surface)',
    },
    itemLeft: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 },
    itemIcon: {
        fontSize: 20,
        width: 42, height: 42,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 14,
        flexShrink: 0,
    },
    itemTitle: { fontSize: 14, fontWeight: 600 },
    itemSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
    tagDone: { color: 'var(--success)', fontWeight: 600 },
    itemRight: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' },
    amount: { fontSize: 14, fontWeight: 700 },
    muted: { color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 20 },
    empty: { textAlign: 'center', padding: '40px 20px' },
    emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.6 },
    emptyTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
    emptyMsg: { color: 'var(--text-muted)', fontSize: 14, marginBottom: 16, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 },
    disclaimer: {
        margin: '16px 18px 0',
        fontSize: 12,
        color: 'var(--text-muted)',
        lineHeight: 1.5,
    },
}

const F = {
    form: { display: 'flex', flexDirection: 'column', gap: 14 },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    field: { display: 'flex', flexDirection: 'column', gap: 6 },
    lbl: { color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 },
    input: {
        padding: '12px 14px',
        background: 'var(--bg-2)',
        border: '1px solid transparent',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text)',
        fontSize: 14,
        outline: 'none',
        fontFamily: 'inherit',
        width: '100%',
    },
    seg: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 4,
        background: 'var(--bg-2)',
        padding: 4,
        borderRadius: 'var(--radius-md)',
    },
    segBtn: {
        padding: '10px 12px',
        background: 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-muted)',
        fontSize: 14,
        fontWeight: 600,
        textAlign: 'center',
    },
    segSpesa: { background: 'var(--surface)', color: 'var(--accent)', boxShadow: 'var(--shadow-sm)' },
    segEntrata: { background: 'var(--surface)', color: 'var(--success)', boxShadow: 'var(--shadow-sm)' },
    actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
    btnGhost: {
        padding: '10px 18px',
        background: 'var(--surface)',
        border: '1px solid var(--line-2)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text)',
        fontSize: 14,
        fontWeight: 600,
    },
    btnPrimary: {
        padding: '10px 18px',
        background: 'var(--grad-hero)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        color: 'white',
        fontWeight: 700,
        fontSize: 14,
        boxShadow: 'var(--shadow-coral)',
    },
    error: {
        padding: '10px 12px',
        background: 'var(--danger-soft)',
        border: '1px solid var(--danger-ring)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--danger)',
        fontSize: 13,
    },
}
