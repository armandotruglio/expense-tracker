import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useCategorie() {
    const [categorie, setCategorie] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false

        const exec = async () => {
            let { data, error } = await supabase
                .from('categorie')
                .select('*')
                .order('ordine', { ascending: true })

            if (cancelled) return

            // Primo accesso di un nuovo utente: nessuna categoria → seed default
            if (!error && (data?.length ?? 0) === 0) {
                const { error: seedError } = await supabase.rpc('seed_categorie_default')
                if (cancelled) return
                if (!seedError) {
                    const res = await supabase
                        .from('categorie')
                        .select('*')
                        .order('ordine', { ascending: true })
                    if (cancelled) return
                    data = res.data
                    error = res.error
                }
            }

            if (error) setError(error.message)
            else setCategorie(data ?? [])
            setLoading(false)
        }

        exec()
        return () => { cancelled = true }
    }, [reloadKey])

    const refresh = () => setReloadKey(k => k + 1)

    const aggiungi = async (cat) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Non autenticato')

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
        refresh,
        aggiungi,
        modifica,
        elimina,
    }
}
