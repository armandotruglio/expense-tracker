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