// src/lib/supabase.js
// Client Supabase singleton: importalo dove ti serve
//   import { supabase, getUserIdOrThrow } from '@/lib/supabase'

import { createClient } from '@supabase/supabase-js'

const url     = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Mancano VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY in .env.local'
  )
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Usato dagli hook che fanno insert/update/delete:
// fornisce l'id utente per filtri "user_id" come difesa in profondità sopra RLS.
export async function getUserIdOrThrow() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')
  return user.id
}
