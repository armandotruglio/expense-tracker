import { useState } from 'react'
import { oggiISO } from '../utils/format'

export default function TransazioneForm({ categorie, catLoading, iniziale, onSubmit, onCancel }) {
    const [data, setData] = useState(iniziale?.data ?? oggiISO())
    const [importo, setImporto] = useState(iniziale ? String(iniziale.importo) : '')
    const [tipo, setTipo] = useState(iniziale?.tipo ?? 'spesa')
    const [categoriaId, setCategoriaId] = useState(iniziale?.categoria_id ?? '')
    const [descrizione, setDescrizione] = useState(iniziale?.descrizione ?? '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        setSaving(true)
        try {
            await onSubmit({
                data,
                importo: parseFloat(importo),
                tipo,
                categoria_id: categoriaId || null,
                descrizione: descrizione || null,
            })
        } catch (err) {
            setError(err.message)
            setSaving(false)
        }
    }

    const isSpesa = tipo === 'spesa'

    return (
        <form onSubmit={handleSubmit} style={S.form}>
            <div style={S.field}>
                <span style={S.lbl}>Tipo</span>
                <div style={S.segmented} role="radiogroup" aria-label="Tipo transazione">
                    <button
                        type="button"
                        role="radio"
                        aria-checked={isSpesa}
                        onClick={() => setTipo('spesa')}
                        style={{ ...S.segBtn, ...(isSpesa ? S.segBtnSpesa : null) }}
                    >
                        <span aria-hidden="true">−</span> Spesa
                    </button>
                    <button
                        type="button"
                        role="radio"
                        aria-checked={!isSpesa}
                        onClick={() => setTipo('entrata')}
                        style={{ ...S.segBtn, ...(!isSpesa ? S.segBtnEntrata : null) }}
                    >
                        <span aria-hidden="true">+</span> Entrata
                    </button>
                </div>
            </div>

            <div style={S.row} className="grid-row-2">
                <label style={S.field}>
                    <span style={S.lbl}>Data</span>
                    <input
                        type="date"
                        value={data}
                        onChange={e => setData(e.target.value)}
                        required
                        style={S.input}
                    />
                </label>
                <label style={S.field}>
                    <span style={S.lbl}>Importo (€)</span>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={importo}
                        onChange={e => setImporto(e.target.value)}
                        required
                        placeholder="0,00"
                        style={S.input}
                        autoFocus
                    />
                </label>
            </div>

            <label style={S.field}>
                <span style={S.lbl}>Categoria</span>
                <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={S.input}>
                    <option value="">— nessuna —</option>
                    {catLoading
                        ? <option>Caricamento…</option>
                        : categorie.map(c => (
                            <option key={c.id} value={c.id}>{c.icona} {c.nome}</option>
                        ))}
                </select>
            </label>

            <label style={S.field}>
                <span style={S.lbl}>Descrizione</span>
                <input
                    type="text"
                    value={descrizione}
                    onChange={e => setDescrizione(e.target.value)}
                    placeholder="es. Spesa Esselunga"
                    style={S.input}
                    maxLength={120}
                />
            </label>

            {error && <div role="alert" style={S.error}>{error}</div>}

            <div style={S.actions}>
                <button type="button" onClick={onCancel} style={S.btnGhost} className="ix-btn-ghost">
                    Annulla
                </button>
                <button type="submit" disabled={saving} style={S.btnPrimary} className="ix-btn-primary">
                    {saving ? 'Salvataggio…' : (iniziale ? '💾 Salva' : '+ Aggiungi')}
                </button>
            </div>
        </form>
    )
}

const S = {
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
        transition: 'border-color var(--t-fast), box-shadow var(--t-fast)',
    },
    segmented: {
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
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        transition: 'background-color var(--t-fast), color var(--t-fast)',
    },
    segBtnSpesa: {
        background: 'var(--surface)',
        color: 'var(--accent)',
        boxShadow: 'var(--shadow-sm)',
    },
    segBtnEntrata: {
        background: 'var(--surface)',
        color: 'var(--success)',
        boxShadow: 'var(--shadow-sm)',
    },
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
}
