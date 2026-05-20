import { useState, useEffect } from 'react'
import { oggiISO } from '../utils/format'

export default function TransazioneForm({ categorie, catLoading, iniziale, onSubmit, onCancel }) {
    const [data, setData] = useState(oggiISO())
    const [importo, setImporto] = useState('')
    const [tipo, setTipo] = useState('spesa')
    const [categoriaId, setCategoriaId] = useState('')
    const [descrizione, setDescrizione] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // popola se siamo in modifica
    useEffect(() => {
        if (iniziale) {
            setData(iniziale.data)
            setImporto(String(iniziale.importo))
            setTipo(iniziale.tipo)
            setCategoriaId(iniziale.categoria_id ?? '')
            setDescrizione(iniziale.descrizione ?? '')
        }
    }, [iniziale])

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

    return (
        <form onSubmit={handleSubmit} style={S.form}>
            <div style={S.row} className="grid-row">
                <label style={S.field}>
                    <span style={S.lbl}>Data</span>
                    <input type="date" value={data} onChange={e => setData(e.target.value)} required style={S.input} />
                </label>
                <label style={S.field}>
                    <span style={S.lbl}>Importo (€)</span>
                    <input type="number" step="0.01" min="0" value={importo} onChange={e => setImporto(e.target.value)} required placeholder="0,00" style={S.input} autoFocus />
                </label>
            </div>

            <div style={S.row} className="grid-row">
                <label style={S.field}>
                    <span style={S.lbl}>Tipo</span>
                    <select value={tipo} onChange={e => setTipo(e.target.value)} style={S.input}>
                        <option value="spesa">Spesa</option>
                        <option value="entrata">Entrata</option>
                    </select>
                </label>
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
            </div>

            <label style={S.field}>
                <span style={S.lbl}>Descrizione</span>
                <input type="text" value={descrizione} onChange={e => setDescrizione(e.target.value)} placeholder="es. Spesa Esselunga" style={S.input} />
            </label>

            {error && <div style={S.error}>{error}</div>}

            <div style={S.actions}>
                <button type="button" onClick={onCancel} style={S.btnGhost}>Annulla</button>
                <button type="submit" disabled={saving} style={S.btnPrimary}>
                    {saving ? 'Salvataggio…' : (iniziale ? '💾 Salva modifiche' : '+ Aggiungi')}
                </button>
            </div>
        </form>
    )
}

const S = {
    form: { display: 'flex', flexDirection: 'column', gap: 14 },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    field: { display: 'flex', flexDirection: 'column', gap: 6 },
    lbl: { color: '#a0a0a0', fontSize: 12 },
    input: { padding: '10px 12px', background: '#0f0f1e', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: '#e6e6e6', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' },
    error: { padding: '10px 12px', background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.3)', borderRadius: 8, color: '#ff6b6b', fontSize: 13 },
    actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
    btnGhost: { padding: '10px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, color: '#e6e6e6', cursor: 'pointer', fontSize: 14 },
    btnPrimary: { padding: '10px 18px', background: 'linear-gradient(135deg, #e94560, #ff6b6b)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
}