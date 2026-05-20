import { createClient } from '@supabase/supabase-js'

// Desabilita fetch cache do Next.js para todas as queries do Supabase
const fetchNoCache: typeof fetch = (url, options) =>
  fetch(url, { ...options, cache: 'no-store' })

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { global: { fetch: fetchNoCache } }
)

export function adminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return null
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false }, global: { fetch: fetchNoCache } }
  )
}

export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const { error } = await supabase.from('licitacoes').select('id').limit(1)
    if (error && error.code === '42P01') {
      return { ok: true, message: 'Conectado ao Supabase — schema ainda não aplicado' }
    }
    if (error) {
      return { ok: false, message: error.message }
    }
    return { ok: true, message: 'Conexão OK — banco acessível' }
  } catch (err) {
    return { ok: false, message: String(err) }
  }
}
