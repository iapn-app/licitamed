export const PALAVRAS_SAUDE = [
  'hospitalar', 'hospital', 'medicamento', 'material médico',
  'equipamento médico', 'opme', 'uti', 'ortopedia', 'farmacêutico',
  'saúde', 'cirúrgico', 'descartável médico', 'insumo hospitalar',
  'ambulatorial', 'pronto-socorro', 'diagnóstico', 'laborat',
  'clínico', 'radiologia', 'imagem médica', 'nutrição enteral',
  'nutrição parenteral', 'enfermagem', 'bioquímico', 'reagente',
  'cateter', 'seringa', 'luva', 'gaze', 'curativo', 'bandagem',
  'implante', 'prótese', 'órtese', 'ventilador', 'desfibrilador',
  'bisturi', 'dreno', 'equipo', 'agulha', 'fio cirúrgico',
  'medicamentos', 'farmácia', 'insumos', 'esterilização',
  'hemoterapia', 'hemodiálise', 'oncológico', 'pediatria',
];

export function temPalavraChave(texto: string): boolean {
  const lower = texto.toLowerCase();
  return PALAVRAS_SAUDE.some(p => lower.includes(p));
}

export function encontrarPalavras(texto: string): string[] {
  const lower = texto.toLowerCase();
  return PALAVRAS_SAUDE.filter(p => lower.includes(p));
}
