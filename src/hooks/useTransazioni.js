import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTransazioni({ from, to } = {}) {
    const [transazioni, setTransazioni] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetch = useCallback(async () => {
        setLoading(true)
        let q = supabase
            .from('transazioni')
            .select('*, categoria:categorie(id, nome, icona, colore)')
            .order('data', { ascending: false })
            .order('created_at', { ascending: false })

        if (from) q = q.gte('data', from)
        if (to) q = q.lte('data', to)

        const { data, error } = await q
        if (error) setError(error.message)
        else setTransazioni(data ?? [])
        setLoading(false)
    }, [from, to])

    useEffect(() => { fetch() }, [fetch])

    const aggiungi = async (tx) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Non autenticato')
        const { data, error } = await supabase
            .from('transazioni')
            .insert({ ...tx, user_id: user.id })
            .select('*, categoria:categorie(id, nome, icona, colore)')
            .single()
        if (error) throw error
        setTransazioni(prev => [data, ...prev])
        return data
    }

    const modifica = async (id, patch) => {
        const { data, error } = await supabase
            .from('transazioni')
            .update(patch)
            .eq('id', id)
            .select('*, categoria:categorie(id, nome, icona, colore)')
            .single()
        if (error) throw error
        setTransazioni(prev => prev.map(t => t.id === id ? data : t))
        return data
    }

    const elimina = async (id) => {
        const { error } = await supabase.from('transazioni').delete().eq('id', id)
        if (error) throw error
        setTransazioni(prev => prev.filter(t => t.id !== id))
    }

    return { transazioni, loading, error, refresh: fetch, aggiungi, modifica, elimina }
}