import { formatEUR } from '../utils/format'

export default function FiltriTransazioni({
    categorie,
    filtri,
    setFiltri,        // { count, totaleSpese, totaleEntrate }
    onReset,
}) {
    const {
        search, tipo, categorieSel, importoMin, importoMax,
        dataDa, dataA, ordine,
    } = filtri

    // helper per aggiornare un singolo campo
    const set = (campo, valore) => setFiltri(prev => ({ ...prev, [campo]: valore }))

    // toggle categoria nella multi-selezione
    const toggleCategoria = (id) => {
        setFiltri(prev => {
            const presente = prev.categorieSel.includes(id)
            return {
                ...prev,
                categorieSel: presente
                    ? prev.categorieSel.filter(c => c !== id)
                    : [...prev.categorieSel, id],
            }
        })
    }

    // costruisci i chip dei filtri attivi
    const chips = []
    if (search.trim()) chips.push({ key: 'search', label: `"${search}"`, onRemove: () => set('search', '') })
    if (tipo !== 'tutti') chips.push({ key: 'tipo', label: tipo === 'spesa' ? 'Solo spese' : 'Solo entrate', onRemove: () => set('tipo', 'tutti') })
    categorieSel.forEach(id => {
        const c = categorie.find(x => x.id === id)
        if (c) chips.push({ key: 'cat-' + id, label: `${c.icona} ${c.nome}`, onRemove: () => toggleCategoria(id) })
    })
    if (importoMin !== '') chips.push({ key: 'min', label: `≥ ${formatEUR(importoMin)}`, onRemove: () => set('importoMin', '') })
    if (importoMax !== '') chips.push({ key: 'max', label: `≤ ${formatEUR(importoMax)}`, onRemove: () => set('importoMax', '') })
    if (dataDa) chips.push({ key: 'dataDa', label: `da ${dataDa}`, onRemove: () => set('dataDa', '') })
    if (dataA) chips.push({ key: 'dataA', label: `a ${dataA}`, onRemove: () => set('dataA', '') })

    const hasFiltri = chips.length > 0

    return (
        <section style={S.section}>
            <div style={S.head}>
                <h2 style={S.h2}>🔎 Filtri</h2>
                {hasFiltri && (
                    <button onClick={onReset} style={S.resetBtn}>Azzera tutto</button>
                )}
            </div>

            {/* RICERCA */}
            <input
                type="text"
                value={search}
                onChange={e => set('search', e.target.value)}
                placeholder="Cerca nella descrizione… (es. lidl, uber)"
                style={S.search}
            />

            {/* RIGA: tipo + ordine */}
            <div style={S.row}>
                <label style={S.field}>
                    <span style={S.lbl}>Tipo</span>
                    <select value={tipo} onChange={e => set('tipo', e.target.value)} style={S.input}>
                        <option value="tutti">Tutti</option>
                        <option value="spesa">Solo spese</option>
                        <option value="entrata">Solo entrate</option>
                    </select>
                </label>
                <label style={S.field}>
                    <span style={S.lbl}>Ordina per</span>
                    <select value={ordine} onChange={e => set('ordine', e.target.value)} style={S.input}>
                        <option value="data_desc">Data (recente → vecchia)</option>
                        <option value="data_asc">Data (vecchia → recente)</option>
                        <option value="importo_desc">Importo (alto → basso)</option>
                        <option value="importo_asc">Importo (basso → alto)</option>
                        <option value="categoria">Categoria (A → Z)</option>
                    </select>
                </label>
            </div>

            {/* RIGA: importo min/max */}
            <div style={S.row}>
                <label style={S.field}>
                    <span style={S.lbl}>Importo minimo (€)</span>
                    <input type="number" step="0.01" min="0" value={importoMin}
                        onChange={e => set('importoMin', e.target.value)}
                        placeholder="0" style={S.input} />
                </label>
                <label style={S.field}>
                    <span style={S.lbl}>Importo massimo (€)</span>
                    <input type="number" step="0.01" min="0" value={importoMax}
                        onChange={e => set('importoMax', e.target.value)}
                        placeholder="∞" style={S.input} />
                </label>
            </div>

            {/* RIGA: data da/a (dentro il mese, o oltre) */}
            <div style={S.row}>
                <label style={S.field}>
                    <span style={S.lbl}>Data da</span>
                    <input type="date" value={dataDa}
                        onChange={e => set('dataDa', e.target.value)} style={S.input} />
                </label>
                <label style={S.field}>
                    <span style={S.lbl}>Data a</span>
                    <input type="date" value={dataA}
                        onChange={e => set('dataA', e.target.value)} style={S.input} />
                </label>
            </div>

            {/* MULTI-SELEZIONE CATEGORIE */}
            <div style={S.field}>
                <span style={S.lbl}>Categorie {categorieSel.length > 0 && `(${categorieSel.length} selez.)`}</span>
                <div style={S.catGrid}>
                    {categorie.map(c => {
                        const attiva = categorieSel.includes(c.id)
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => toggleCategoria(c.id)}
                                style={{
                                    ...S.catChip,
                                    ...(attiva ? { borderColor: c.colore, background: `${c.colore}22`, color: '#e6e6e6' } : null),
                                }}
                            >
                                <span>{c.icona}</span>
                                <span style={S.catName}>{c.nome}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

        </section>
    )
}

const S = {
    section: { background: '#1e1e2f', padding: 24, borderRadius: 14, border: '1px solid rgba(255,255,255,.05)', marginBottom: 24 },
    head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    h2: { margin: 0, fontSize: 18 },
    resetBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, color: '#a0a0a0', cursor: 'pointer', fontSize: 12, padding: '6px 12px' },
    search: { width: '100%', padding: '12px 14px', background: '#0f0f1e', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, color: '#e6e6e6', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
    row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 },
    field: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 },
    lbl: { color: '#a0a0a0', fontSize: 12 },
    input: { padding: '10px 12px', background: '#0f0f1e', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: '#e6e6e6', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
    catGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    catChip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#0f0f1e', border: '1px solid rgba(255,255,255,.08)', borderRadius: 999, color: '#a0a0a0', cursor: 'pointer', fontSize: 13 },
    catName: { fontSize: 13 },
    chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.06)' },
    chip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 12px', background: 'rgba(233,69,96,.12)', border: '1px solid rgba(233,69,96,.3)', borderRadius: 999, color: '#e6e6e6', fontSize: 12 },
    chipX: { background: 'transparent', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: 12, padding: '0 4px', lineHeight: 1 },
    summary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.06)' },
    summaryCount: { color: '#a0a0a0', fontSize: 13 },
    summaryAmts: { display: 'flex', gap: 12, fontSize: 14, fontWeight: 600 },
}