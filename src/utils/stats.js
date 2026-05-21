// Funzione pura: prende le transazioni di un mese (e le categorie per il budget)
// e ritorna tutti gli aggregati che servono a Home, BudgetList, insights, ecc.
// Memoizzala nel chiamante con useMemo se le dipendenze sono stabili.

export function statsMese(transazioni, categorie = []) {
    let totSpese = 0
    let totEntrate = 0
    const perCategoria = new Map()
    const perGiorno = new Map()

    for (const t of transazioni) {
        const imp = Number(t.importo)
        if (t.tipo === 'spesa') {
            totSpese += imp
            const k = t.categoria_id ?? 'nessuna'
            const cur = perCategoria.get(k) ?? {
                id: k,
                nome: t.categoria?.nome ?? 'Senza categoria',
                icona: t.categoria?.icona ?? '📄',
                colore: t.categoria?.colore ?? '#a78bfa',
                totale: 0,
                count: 0,
            }
            cur.totale += imp
            cur.count += 1
            perCategoria.set(k, cur)
        } else if (t.tipo === 'entrata') {
            totEntrate += imp
        }

        const segno = t.tipo === 'spesa' ? -1 : 1
        perGiorno.set(t.data, (perGiorno.get(t.data) ?? 0) + segno * imp)
    }

    const saldo = totEntrate - totSpese

    let topCategoria = null
    for (const c of perCategoria.values()) {
        if (!topCategoria || c.totale > topCategoria.totale) topCategoria = c
    }

    const budgetTotale = categorie.reduce(
        (s, c) => s + Number(c.budget_mensile ?? 0), 0
    )
    const budget = {
        totale: budgetTotale,
        speso: totSpese,
        restante: Math.max(budgetTotale - totSpese, 0),
        pct: budgetTotale > 0 ? Math.min(100, (totSpese / budgetTotale) * 100) : 0,
    }

    return {
        totSpese,
        totEntrate,
        saldo,
        perCategoria,
        perGiorno,
        topCategoria,
        budget,
    }
}
