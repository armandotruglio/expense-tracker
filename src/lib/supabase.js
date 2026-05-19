// src/lib/supabase.js
// Client Supabase singleton: importalo dove ti serve
//   import { supabase } from '@/lib/supabase'

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

// ---------- Helpers tipizzati a mano (no TypeScript per ora) ----------

export async function getCategorie() {
  const { data, error } = await supabase
    .from('categorie')
    .select('*')
    .order('ordine', { ascending: true })
  if (error) throw error
  return data
}

export async function getTransazioni({ from, to, tipo, categoriaId } = {}) {
  let q = supabase
    .from('transazioni')
    .select('*, categoria:categorie(nome, icona, colore)')
    .order('data', { ascending: false })

  if (from)         q = q.gte('data', from)
  if (to)           q = q.lte('data', to)
  if (tipo)         q = q.eq('tipo', tipo)
  if (categoriaId)  q = q.eq('categoria_id', categoriaId)

  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getRiepilogoMese(mese /* 'YYYY-MM-01' */) {
  const { data, error } = await supabase
    .from('v_riepilogo_mensile')
    .select('*')
    .eq('mese', mese)
  if (error) throw error
  return data
}

export async function insertTransazione(tx) {
  // tx: { data, importo, descrizione, tipo, categoria_id, note }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const { data, error } = await supabase
    .from('transazioni')
    .insert({ ...tx, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTransazione(id, patch) {
  const { data, error } = await supabase
    .from('transazioni')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTransazione(id) {
  const { error } = await supabase.from('transazioni').delete().eq('id', id)
  if (error) throw error
}
