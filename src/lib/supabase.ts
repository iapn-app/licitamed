import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const { error } = await supabase.from('licitacoes').select('id').limit(1)
    // 42P01 = table does not exist — connection works, schema not applied yet
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
