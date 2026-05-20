import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCategorie() {
    const [categorie, setCategorie] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchCategorie = useCallback(async () => {
        setLoading(true)
        let { data, error } = await supabase
            .from('categorie')
            .select('*')
            .order('ordine', { ascending: true })

        // Primo accesso di un nuovo utente: nessuna categoria → seed default
        if (!error && (data?.length ?? 0) === 0) {
            const { error: seedError } = await supabase.rpc('seed_categorie_default')
            if (!seedError) {
                const res = await supabase
                    .from('categorie')
                    .select('*')
                    .order('ordine', { ascending: true })
                data = res.data
                error = res.error
            }
        }

        if (error) setError(error.message)
        else setCategorie(data ?? [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchCategorie() }, [fetchCategorie])

    const aggiungi = async (cat) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Non autenticato')

        // calcola prossimo "ordine"
        const maxOrdine = categorie.reduce((m, c) => Math.max(m, c.ordine ?? 0), 0)

        const { data, error } = await supabase
            .from('categorie')
            .insert({ ...cat, user_id: user.id, ordine: maxOrdine + 1 })
            .select()
            .single()
        if (error) throw error
        setCategorie(prev => [...prev, data].sort((a, b) => a.ordine - b.ordine))
        return data
    }

    const modifica = async (id, patch) => {
        const { data, error } = await supabase
            .from('categorie')
            .update(patch)
            .eq('id', id)
            .select()
            .single()
        if (error) throw error
        setCategorie(prev => prev.map(c => c.id === id ? data : c))
        return data
    }

    const elimina = async (id) => {
        const { error } = await supabase.from('categorie').delete().eq('id', id)
        if (error) throw error
        setCategorie(prev => prev.filter(c => c.id !== id))
    }

    return {
        categorie,
        loading,
        error,
        refresh: fetchCategorie,
        aggiungi,
        modifica,
        elimina,
    }
}