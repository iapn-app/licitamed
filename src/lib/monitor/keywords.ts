export const PALAVRAS_SAUDE = [
  // Estabelecimentos
  'hospitalar', 'hospital', 'ubs', 'unidade básica de saúde',
  'pronto-socorro', 'clínica', 'ambulatorial', 'hemocentro',
  // Medicamentos e insumos específicos
  'medicamento', 'farmácia', 'farmacêutico', 'insumo hospitalar',
  'material médico', 'material hospitalar', 'equipamento médico',
  'opme', 'reagente', 'esterilização',
  // Dispositivos clínicos
  'prótese', 'órtese', 'ventilador pulmonar', 'desfibrilador',
  'cateter', 'bisturi', 'dreno', 'fio cirúrgico',
  'nutrição enteral', 'nutrição parenteral',
  // Especialidades e procedimentos
  'cirúrgico', 'uti', 'diagnóstico', 'laboratório', 'laboratorial',
  'radiologia', 'hemodiálise', 'hemoterapia', 'oncologia', 'oncológico',
  'reabilitação', 'vacina', 'enfermagem', 'odontológico', 'ortopédico',
  'saúde pública',
];

export function temPalavraChave(texto: string): boolean {
  const lower = texto.toLowerCase();
  return PALAVRAS_SAUDE.some(p => lower.includes(p));
}

export function encontrarPalavras(texto: string): string[] {
  const lower = texto.toLowerCase();
  return PALAVRAS_SAUDE.filter(p => lower.includes(p));
}
