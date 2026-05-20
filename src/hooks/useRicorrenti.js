import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const KEY_PREFIX = 'expense-tracker:ricorrenti:'

// Schema item:
// { id: string, nome: string, importo: number, tipo: 'spesa'|'entrata',
//   categoria_id: number|null, giorno: 1..31, ultimaApplicazione: 'YYYY-MM' | null }

function leggi(userId) {
    try {
        const raw = localStorage.getItem(KEY_PREFIX + userId)
        if (!raw) return []
        return JSON.parse(raw)
    } catch {
        return []
    }
}

function scrivi(userId, list) {
    localStorage.setItem(KEY_PREFIX + userId, JSON.stringify(list))
}

function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function useRicorrenti() {
    const [userId, setUserId] = useState(null)
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (cancelled) return
            if (!user) {
                setLoading(false)
                return
            }
            setUserId(user.id)
            setList(leggi(user.id))
            setLoading(false)
        }
        load()
        return () => { cancelled = true }
    }, [])

    const aggiungi = useCallback((item) => {
        if (!userId) return null
        const nuovo = {
            id: newId(),
            ultimaApplicazione: null,
            ...item,
        }
        setList(prev => {
            const next = [...prev, nuovo]
            scrivi(userId, next)
            return next
        })
        return nuovo
    }, [userId])

    const modifica = useCallback((id, patch) => {
        if (!userId) return
        setList(prev => {
            const next = prev.map(r => r.id === id ? { ...r, ...patch } : r)
            scrivi(userId, next)
            return next
        })
    }, [userId])

    const elimina = useCallback((id) => {
        if (!userId) return
        setList(prev => {
            const next = prev.filter(r => r.id !== id)
            scrivi(userId, next)
            return next
        })
    }, [userId])

    const segnaApplicato = useCallback((id, meseISO) => {
        modifica(id, { ultimaApplicazione: meseISO })
    }, [modifica])

    return { ricorrenti: list, loading, aggiungi, modifica, elimina, segnaApplicato }
}
