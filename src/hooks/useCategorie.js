import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCategorie() {
    const [categorie, setCategorie] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchCategorie = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('categorie')
            .select('*')
            .order('ordine', { ascending: true })

        if (error) setError(error.message)
        else setCategorie(data ?? [])
        setLoading(false)
    }, [])

    useEffect(() => { fetchCategorie() }, [fetchCategorie])

    return { categorie, loading, error, refresh: fetchCategorie }
}