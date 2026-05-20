// Export transazioni in CSV (con BOM UTF-8 per Excel/Numbers IT)

import { formatData } from './format'

export function transazioniToCSV(transazioni) {
    const header = ['Data', 'Tipo', 'Categoria', 'Descrizione', 'Importo (EUR)']
    const rows = transazioni.map(t => [
        formatData(t.data),
        t.tipo === 'spesa' ? 'Spesa' : 'Entrata',
        t.categoria?.nome ?? '',
        t.descrizione ?? '',
        (t.tipo === 'spesa' ? -1 : 1) * Number(t.importo),
    ])

    const escape = (v) => {
        const s = String(v ?? '')
        if (s.includes(';') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`
        }
        return s
    }

    const lines = [header, ...rows].map(r => r.map(escape).join(';'))
    return '﻿' + lines.join('\r\n')
}

export function downloadCSV(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
