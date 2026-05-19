export const formatEUR = (n) =>
    new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
    }).format(Number(n) || 0)

export const formatData = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const oggiISO = () => new Date().toISOString().slice(0, 10)

// ----- gestione mesi (timezone-safe) -----

const pad = (n) => String(n).padStart(2, '0')

// "2026-05" da una Date (interpretata in ora locale)
export const meseISO = (d = new Date()) => {
    const dt = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`
}

// primo e ultimo giorno di un mese "YYYY-MM" → { from: "YYYY-MM-01", to: "YYYY-MM-XX" }
export const intervalloMese = (mese) => {
    const [y, m] = mese.split('-').map(Number)
    const ultimoGiorno = new Date(y, m, 0).getDate() // m = 1-12 → day 0 del mese successivo = ultimo del nostro
    return {
        from: `${mese}-01`,
        to: `${mese}-${pad(ultimoGiorno)}`,
    }
}

// "2026-05" → "Maggio 2026"
export const meseLabel = (mese) => {
    const [y, m] = mese.split('-').map(Number)
    const nomi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
    return `${nomi[m - 1]} ${y}`
}

// mese precedente/successivo a "YYYY-MM" — aritmetica pura sui numeri, niente Date
export const mesePrec = (mese) => {
    let [y, m] = mese.split('-').map(Number)
    m -= 1
    if (m < 1) { m = 12; y -= 1 }
    return `${y}-${pad(m)}`
}

export const meseSucc = (mese) => {
    let [y, m] = mese.split('-').map(Number)
    m += 1
    if (m > 12) { m = 1; y += 1 }
    return `${y}-${pad(m)}`
}