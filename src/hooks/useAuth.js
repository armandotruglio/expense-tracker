import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // sessione corrente (se già loggato da prima)
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session)
            setLoading(false)
        })

        // ascolta cambi (login/logout/refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => setSession(session)
        )

        return () => subscription.unsubscribe()
    }, [])

    const signIn = (email, password) =>
        supabase.auth.signInWithPassword({ email, password })

    const signOut = () => supabase.auth.signOut()

    return {
        session,
        user: session?.user ?? null,
        loading,
        signIn,
        signOut,
    }
}