export const PALAVRAS_SAUDE = [
  // Estabelecimentos e unidades
  'hospitalar', 'hospital', 'ubs', 'unidade básica', 'unidade de saúde',
  'posto de saúde', 'pronto-socorro', 'upa ', 'clínica', 'ambulatório',
  'ambulatorial', 'hemocentro', 'maternidade',
  // Categorias amplas
  'saúde', 'médico', 'médica', 'médicos', 'farmácia', 'farmacêutico',
  'enfermagem', 'diagnóstico', 'laborat', 'radiologia',
  // Medicamentos e insumos
  'medicamento', 'medicamentos', 'insumo hospitalar', 'insumos',
  'material médico', 'material hospitalar', 'equipamento médico',
  'descartável médico', 'esterilização', 'reagente',
  // Dispositivos e equipamentos
  'opme', 'implante', 'prótese', 'órtese', 'ventilador', 'desfibrilador',
  'cateter', 'seringa', 'luva', 'gaze', 'curativo', 'bandagem',
  'bisturi', 'dreno', 'equipo', 'agulha', 'fio cirúrgico',
  'imagem médica', 'oxigênio', 'vacina',
  // Especialidades
  'uti', 'ortopedia', 'cirúrgico', 'nutrição enteral', 'nutrição parenteral',
  'bioquímico', 'hemoterapia', 'hemodiálise', 'oncologia', 'oncológico',
  'pediatria', 'reabilitação',
];

export function temPalavraChave(texto: string): boolean {
  const lower = texto.toLowerCase();
  return PALAVRAS_SAUDE.some(p => lower.includes(p));
}

export function encontrarPalavras(texto: string): string[] {
  const lower = texto.toLowerCase();
  return PALAVRAS_SAUDE.filter(p => lower.includes(p));
}
