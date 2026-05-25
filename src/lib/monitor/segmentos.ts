const REGRAS = [
  { segmento: 'OPME', regex: /opme|órtese|ortese|prótese|protese|implante/i },
  { segmento: 'Medicamentos', regex: /medicamento|farmac|droga|antibiótico|vacina|insumo farmac/i },
  { segmento: 'Equipamentos Médicos', regex: /equipamento médico|ventilador|monitor multip|desfibrilador|bisturi|bomba de infus/i },
  { segmento: 'Material Hospitalar', regex: /material hospitalar|curativo|gaze|seringa|luva|cateter|agulha|bandagem|descartável|equipo/i },
  { segmento: 'Diagnóstico e Laboratório', regex: /laborat|reagente|diagnóst|kit diagnóst|bioquím/i },
  { segmento: 'Radiologia e Imagem', regex: /radiolog|imagem|ultrassom|tomograf|ressonânc|raio.?x/i },
  { segmento: 'Serviços de Saúde', regex: /serviço.{0,20}saúde|serviço.{0,20}hospitalar|home care|assistência.{0,20}saúde/i },
  { segmento: 'Nutrição Clínica', regex: /nutrição enteral|nutrição parenteral|suplemento nutricional/i },
];

export function classificarSegmento(objeto: string): string {
  for (const r of REGRAS) {
    if (r.regex.test(objeto)) return r.segmento;
  }
  return 'Outros';
}

export const CORES_SEGMENTO: Record<string, string> = {
  'OPME': 'bg-red-50 text-red-700 border-red-200',
  'Medicamentos': 'bg-blue-50 text-blue-700 border-blue-200',
  'Equipamentos Médicos': 'bg-purple-50 text-purple-700 border-purple-200',
  'Material Hospitalar': 'bg-orange-50 text-orange-700 border-orange-200',
  'Diagnóstico e Laboratório': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Radiologia e Imagem': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Serviços de Saúde': 'bg-green-50 text-green-700 border-green-200',
  'Nutrição Clínica': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Outros': 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

export const TODOS_SEGMENTOS = [
  'OPME', 'Medicamentos', 'Equipamentos Médicos', 'Material Hospitalar',
  'Diagnóstico e Laboratório', 'Radiologia e Imagem', 'Serviços de Saúde',
  'Nutrição Clínica', 'Outros',
];
