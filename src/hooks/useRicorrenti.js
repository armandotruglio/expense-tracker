import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const LS_KEY_PREFIX = 'expense-tracker:ricorrenti:'

// Mapping snake_case (DB) <-> camelCase (frontend), per non toccare i consumer.
function dbToApp(row) {
    return {
        id: row.id,
        nome: row.nome,
        importo: Number(row.importo),
        tipo: row.tipo,
        categoria_id: row.categoria_id,
        giorno: row.giorno,
        ultimaApplicazione: row.ultima_applicazione,
    }
}

function appToDb(item) {
    const out = {}
    if ('nome' in item) out.nome = item.nome
    if ('importo' in item) out.importo = item.importo
    if ('tipo' in item) out.tipo = item.tipo
    if ('categoria_id' in item) out.categoria_id = item.categoria_id ?? null
    if ('giorno' in item) out.giorno = item.giorno
    if ('ultimaApplicazione' in item) out.ultima_applicazione = item.ultimaApplicazione
    return out
}

export function useRicorrenti() {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false

        const exec = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (cancelled) return
            if (!user) {
                setLoading(false)
                return
            }

            const { data, error: fetchErr } = await supabase
                .from('ricorrenze')
                .select('*')
                .order('id', { ascending: true })

            if (cancelled) return

            if (fetchErr) {
                setError(fetchErr.message)
                setLoading(false)
                return
            }

            let rows = data ?? []

            // Migrazione one-shot: se ho ricorrenze nel localStorage e il DB
            // è vuoto, le sposto nel DB e poi pulisco lo storage locale.
            const lsKey = LS_KEY_PREFIX + user.id
            if (rows.length === 0) {
                const lsRaw = localStorage.getItem(lsKey)
                if (lsRaw) {
                    try {
                        const lsItems = JSON.parse(lsRaw)
                        if (Array.isArray(lsItems) && lsItems.length > 0) {
                            const toInsert = lsItems
                                .filter(it => it.nome && it.importo > 0)
                                .map(it => ({
                                    user_id: user.id,
                                    nome: it.nome,
                                    importo: it.importo,
                                    tipo: it.tipo,
                                    categoria_id: it.categoria_id ?? null,
                                    giorno: it.giorno,
                                    ultima_applicazione: it.ultimaApplicazione ?? null,
                                }))
                            if (toInsert.length > 0) {
                                const { data: inserted, error: insErr } = await supabase
                                    .from('ricorrenze')
                                    .insert(toInsert)
                                    .select()
                                if (!cancelled && !insErr && inserted) {
                                    rows = inserted
                                }
                            }
                        }
                        localStorage.removeItem(lsKey)
                    } catch {
                        // ignora errori migrazione, lo storage può essere corrotto
                    }
                }
            }

            if (cancelled) return
            setList(rows.map(dbToApp))
            setLoading(false)
        }

        exec()
        return () => { cancelled = true }
    }, [reloadKey])

    const refresh = useCallback(() => setReloadKey(k => k + 1), [])

    const aggiungi = useCallback(async (item) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Non autenticato')

        const { data, error } = await supabase
            .from('ricorrenze')
            .insert({ user_id: user.id, ...appToDb(item) })
            .select()
            .single()
        if (error) throw error
        const nuovo = dbToApp(data)
        setList(prev => [...prev, nuovo])
        return nuovo
    }, [])

    const modifica = useCallback(async (id, patch) => {
        const { data, error } = await supabase
            .from('ricorrenze')
            .update(appToDb(patch))
            .eq('id', id)
            .select()
            .single()
        if (error) throw error
        const updated = dbToApp(data)
        setList(prev => prev.map(r => r.id === id ? updated : r))
        return updated
    }, [])

    const elimina = useCallback(async (id) => {
        const { error } = await supabase.from('ricorrenze').delete().eq('id', id)
        if (error) throw error
        setList(prev => prev.filter(r => r.id !== id))
    }, [])

    const segnaApplicato = useCallback((id, meseISO) => {
        return modifica(id, { ultimaApplicazione: meseISO })
    }, [modifica])

    return {
        ricorrenti: list,
        loading,
        error,
        refresh,
        aggiungi,
        modifica,
        elimina,
        segnaApplicato,
    }
}
