import { useEffect, useState } from 'react'
import { getUserIdOrThrow, supabase } from '../lib/supabase'

const TX_SELECT = '*, categoria:categorie(id, nome, icona, colore)'

export function useTransazioni({ from, to } = {}) {
    const [transazioni, setTransazioni] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false

        const exec = async () => {
            let q = supabase
                .from('transazioni')
                .select(TX_SELECT)
                .order('data', { ascending: false })
                .order('created_at', { ascending: false })

            if (from) q = q.gte('data', from)
            if (to) q = q.lte('data', to)

            const { data, error } = await q
            if (cancelled) return
            if (error) setError(error.message)
            else setTransazioni(data ?? [])
            setLoading(false)
        }

        exec()
        return () => { cancelled = true }
    }, [from, to, reloadKey])

    const refresh = () => setReloadKey(k => k + 1)

    const aggiungi = async (tx) => {
        const userId = await getUserIdOrThrow()
        const { data, error } = await supabase
            .from('transazioni')
            .insert({ ...tx, user_id: userId })
            .select(TX_SELECT)
            .single()
        if (error) throw error
        setTransazioni(prev => [data, ...prev])
        return data
    }

    const modifica = async (id, patch) => {
        const userId = await getUserIdOrThrow()
        const { data, error } = await supabase
            .from('transazioni')
            .update(patch)
            .eq('id', id)
            .eq('user_id', userId)
            .select(TX_SELECT)
            .single()
        if (error) throw error
        setTransazioni(prev => prev.map(t => t.id === id ? data : t))
        return data
    }

    const elimina = async (id) => {
        const userId = await getUserIdOrThrow()
        const { error } = await supabase
            .from('transazioni')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        if (error) throw error
        setTransazioni(prev => prev.filter(t => t.id !== id))
    }

    return { transazioni, loading, error, refresh, aggiungi, modifica, elimina }
}
