export default function FiltriTransazioni({ categorie, filtri, setFiltri, onReset }) {
    const { search, tipo, categorieSel, importoMin, importoMax, dataDa, dataA, ordine } = filtri

    const set = (campo, valore) => setFiltri(prev => ({ ...prev, [campo]: valore }))

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

    const hasFiltri =
        search.trim() || tipo !== 'tutti' || categorieSel.length > 0 ||
        importoMin !== '' || importoMax !== '' || dataDa || dataA

    return (
        <div style={S.body}>
            <label style={S.field}>
                <span style={S.lbl}>Cerca</span>
                <input
                    type="search"
                    value={search}
                    onChange={e => set('search', e.target.value)}
                    placeholder="es. lidl, uber…"
                    style={S.input}
                />
            </label>

            <div style={S.row} className="grid-row-2">
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

            <div style={S.row} className="grid-row-2">
                <label style={S.field}>
                    <span style={S.lbl}>Importo minimo (€)</span>
                    <input
                        type="number" step="0.01" min="0" inputMode="decimal"
                        value={importoMin}
                        onChange={e => set('importoMin', e.target.value)}
                        placeholder="0" style={S.input}
                    />
                </label>
                <label style={S.field}>
                    <span style={S.lbl}>Importo massimo (€)</span>
                    <input
                        type="number" step="0.01" min="0" inputMode="decimal"
                        value={importoMax}
                        onChange={e => set('importoMax', e.target.value)}
                        placeholder="∞" style={S.input}
                    />
                </label>
            </div>

            <div style={S.row} className="grid-row-2">
                <label style={S.field}>
                    <span style={S.lbl}>Data da</span>
                    <input type="date" value={dataDa} onChange={e => set('dataDa', e.target.value)} style={S.input} />
                </label>
                <label style={S.field}>
                    <span style={S.lbl}>Data a</span>
                    <input type="date" value={dataA} onChange={e => set('dataA', e.target.value)} style={S.input} />
                </label>
            </div>

            <div style={S.field}>
                <span style={S.lbl}>
                    Categorie {categorieSel.length > 0 && `(${categorieSel.length} selezionate)`}
                </span>
                <div style={S.catGrid}>
                    {categorie.map(c => {
                        const attiva = categorieSel.includes(c.id)
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => toggleCategoria(c.id)}
                                aria-pressed={attiva}
                                style={{
                                    ...S.catChip,
                                    ...(attiva ? { borderColor: c.colore, background: `${c.colore}22`, color: 'var(--text)' } : null),
                                }}
                            >
                                <span aria-hidden="true">{c.icona}</span>
                                <span style={S.catName}>{c.nome}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {hasFiltri && (
                <div style={S.footer}>
                    <button type="button" onClick={onReset} style={S.resetBtn} className="ix-btn-ghost">
                        Azzera tutto
                    </button>
                </div>
            )}
        </div>
    )
}

const S = {
    body: { display: 'flex', flexDirection: 'column', gap: 14 },
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
        transition: 'border-color var(--t-fast), box-shadow var(--t-fast)',
    },
    row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 },
    catGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    catChip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-pill)',
        color: 'var(--text-muted)',
        fontSize: 13,
        minHeight: 36,
        transition: 'background-color var(--t-fast), border-color var(--t-fast), color var(--t-fast)',
    },
    catName: { fontSize: 13 },
    footer: { display: 'flex', justifyContent: 'flex-end', marginTop: 6 },
    resetBtn: {
        background: 'var(--surface)',
        border: '1px solid var(--line-2)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-muted)',
        fontSize: 12,
        fontWeight: 600,
        padding: '8px 14px',
    },
}
