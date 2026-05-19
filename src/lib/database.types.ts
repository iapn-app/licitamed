export interface LicitacaoRow {
  id: string
  created_at: string
  nome: string
  orgao: string
  numero_processo: string | null
  valor_estimado: number | null
  data_pregao: string | null
  status: string
  progresso: number
  uf: string | null
  municipio: string | null
  objeto: string | null
  edital_url: string | null
  observacoes: string | null
}

export interface FornecedorRow {
  id: string
  created_at: string
  nome: string
  cnpj: string | null
  email: string | null
  whatsapp: string | null
  categorias: string[] | null
  score: number
  uf: string | null
  municipio: string | null
  observacoes: string | null
  ativo: boolean
}
