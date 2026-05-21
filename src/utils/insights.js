// Genera insight automatici confrontando il mese corrente con il precedente.
// Riceve gli oggetti già aggregati da statsMese() per non ri-fare i conti.

import { formatEUR } from './format'

const SOGLIA_PCT = 15 // ignora variazioni sotto il 15% (troppo rumorose)

export function generaInsights({ statsMese, statsMesePrec, categorie }) {
    const insights = []

    const totMese = statsMese.totSpese
    const totMesePrec = statsMesePrec.totSpese

    // 1) Confronto totale mese vs mese precedente
    if (totMesePrec > 0 && totMese > 0) {
        const pct = ((totMese - totMesePrec) / totMesePrec) * 100
        if (Math.abs(pct) >= SOGLIA_PCT) {
            if (pct < 0) {
                insights.push({
                    id: 'totale-giu',
                    tone: 'good',
                    icon: '🌱',
                    text: `Bel lavoro! Hai speso il ${Math.abs(pct).toFixed(0)}% in meno rispetto al mese scorso.`,
                })
            } else {
                insights.push({
                    id: 'totale-su',
                    tone: 'warn',
                    icon: '⚠️',
                    text: `Stai spendendo il ${pct.toFixed(0)}% in più rispetto al mese scorso. Tienilo d'occhio.`,
                })
            }
        }
    }

    // 2) Categoria che cresce/cala di più
    const variazioni = []
    for (const [catId, cur] of statsMese.perCategoria.entries()) {
        const prec = statsMesePrec.perCategoria.get(catId)?.totale ?? 0
        if (prec === 0 || cur.totale === 0) continue
        const pct = ((cur.totale - prec) / prec) * 100
        if (Math.abs(pct) >= SOGLIA_PCT && Math.max(cur.totale, prec) > 30) {
            variazioni.push({ catId, totale: cur.totale, prec, pct })
        }
    }
    variazioni.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    const top = variazioni[0]
    if (top) {
        const cat = categorie.find(c => c.id === top.catId)
        const nome = cat ? `${cat.icona} ${cat.nome}` : 'Senza categoria'
        if (top.pct < 0) {
            insights.push({
                id: `cat-giu-${top.catId}`,
                tone: 'good',
                icon: '✨',
                text: `Hai speso il ${Math.abs(top.pct).toFixed(0)}% in meno in ${nome} rispetto al mese scorso. Continua così.`,
            })
        } else {
            insights.push({
                id: `cat-su-${top.catId}`,
                tone: 'warn',
                icon: '👀',
                text: `${nome} è cresciuta del ${top.pct.toFixed(0)}% rispetto al mese scorso (da ${formatEUR(top.prec)} a ${formatEUR(top.totale)}).`,
            })
        }
    }

    // 3) Budget vicino al limite
    for (const cat of categorie) {
        const budget = Number(cat.budget_mensile ?? 0)
        if (budget <= 0) continue
        const speso = statsMese.perCategoria.get(cat.id)?.totale ?? 0
        const pct = (speso / budget) * 100
        if (pct >= 100) {
            insights.push({
                id: `budget-over-${cat.id}`,
                tone: 'bad',
                icon: '🚨',
                text: `Budget di ${cat.icona} ${cat.nome} superato di ${formatEUR(speso - budget)}.`,
            })
        } else if (pct >= 85) {
            insights.push({
                id: `budget-near-${cat.id}`,
                tone: 'warn',
                icon: '⏰',
                text: `Sei al ${pct.toFixed(0)}% del budget di ${cat.icona} ${cat.nome}.`,
            })
        }
    }

    // Limita a 3 per non saturare
    return insights.slice(0, 3)
}
