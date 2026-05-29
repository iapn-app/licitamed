import type { PalavraChaveMonitor } from './types';

// ─── Palavras organizadas por categoria ──────────────────────────────────────
// Cada categoria tem peso implícito: equipamentos/descartaveis = alta relevância
// generico_saude = relevância menor mas amplia cobertura

export const PALAVRAS_POR_CATEGORIA: Record<
  PalavraChaveMonitor['categoria'],
  string[]
> = {

  // Aparelhos, dispositivos e mobiliário hospitalar
  equipamentos: [
    'equipamento médico', 'equipamento medico',
    'equipamento hospitalar',
    'ventilador pulmonar', 'ventilador mecânico', 'ventilador mecanico',
    'desfibrilador',
    'monitor multiparamétrico', 'monitor multiparametrico',
    'monitor cardíaco', 'monitor cardiaco',
    'laringoscópio', 'laringoscopio',
    'oxímetro', 'oximetro',
    'esfigmomanômetro', 'esfigmomanometro',
    'bomba de infusão', 'bomba de infusao', 'bomba infusora',
    'autoclave',
    'nebulizador',
    'concentrador de oxigênio', 'concentrador de oxigenio',
    'aspirador cirúrgico', 'aspirador cirurgico', 'aspirador hospitalar',
    'foco cirúrgico', 'foco cirurgico',
    'incubadora',
    'berço aquecido', 'berco aquecido', 'berço neonatal', 'berco neonatal',
    'cama hospitalar',
    'eletrocardiograma', 'ecg',
    'balança hospitalar', 'balanca hospitalar',
    'cadeira de rodas',
    'fototerapia',
    'eletrocirúrgico', 'eletrocirurgico',
    'bisturi elétrico', 'bisturi eletrico',
    'centrífuga', 'centrifuga',
    'microscópio', 'microscopio',
    'maca hospitalar',
    'scialítica', 'scalitica',
  ],

  // Produtos de uso único descartados após o procedimento
  descartaveis: [
    'seringa',
    'agulha',
    'equipo',
    'scalp',
    'jelco',
    'abocath',
    'cateter',
    'sonda',
    'sonda vesical',
    'sonda nasogástrica', 'sonda nasogastrica',
    'sonda foley',
    'luva cirúrgica', 'luva cirurgica',
    'luva de procedimento',
    'luva estéril', 'luva esteril',
    'máscara cirúrgica', 'mascara cirurgica',
    'máscara n95', 'mascara n95', 'pff2',
    'campo cirúrgico', 'campo cirurgico',
    'campo estéril', 'campo esteril',
    'campo fenestrado',
    'compressa',
    'curativo',
    'atadura',
    'bandagem',
    'esparadrapo',
    'micropore',
    'coletor',
    'saco coletor',
    'bolsa coletora',
    'bolsa de colostomia',
    'fraldas descartáveis', 'fraldas descartaveis',
    'avental descartável', 'avental descartavel',
    'touca descartável', 'touca descartavel',
    'propé', 'prope',
    'sapatilha descartável', 'sapatilha descartavel',
    'gorro cirúrgico', 'gorro cirurgico',
    'descartável', 'descartavel',
    'dreno',
  ],

  // Materiais consumíveis e líquidos de suporte clínico
  insumos: [
    'reagente',
    'medicamento',
    'insumo hospitalar',
    'insumo médico', 'insumo medico',
    'nutrição enteral', 'nutricao enteral',
    'nutrição parenteral', 'nutricao parenteral',
    'vacina',
    'soro fisiológico', 'soro fisiologico',
    'solução salina', 'solucao salina',
    'álcool gel', 'alcool gel',
    'álcool 70', 'alcool 70',
    'clorexidina',
    'pvpi', 'povidona',
    'gel para ultrassom', 'gel ultrassom',
    'lamínula', 'laminula',
    'tubo de coleta',
    'frasco coletor',
    'meio de cultura',
    'tira reagente',
    'lanceta',
    'solução de diálise', 'solucao de dialise',
    'bolsa de diálise', 'bolsa de dialise',
    'filme radiográfico', 'filme radiografico',
    'fio de sutura',
    'fio cirúrgico', 'fio cirurgico',
    'ácido cítrico', 'acido citrico',
    'formol', 'formaldeído', 'formaldeido',
    'hipoclorito',
  ],

  // Dispositivos de precisão, instrumental e implantes
  correlatos: [
    'prótese', 'protese',
    'órtese', 'ortese',
    'opme',
    'bisturi',
    'ortopédico', 'ortopedico',
    'implante',
    'endoprótese', 'endoprotese',
    'fixador externo',
    'parafuso ortopédico', 'parafuso ortopedico',
    'placa ortopédica', 'placa ortopedica',
    'termômetro', 'termometro',
    'espátula', 'espatula',
    'estetoscópio', 'estetoscopio',
    'pinça', 'pinca',
    'tesoura cirúrgica', 'tesoura cirurgica',
    'porta-agulha',
    'afastador cirúrgico', 'afastador cirurgico',
    'fórceps', 'forceps',
    'bandeja cirúrgica', 'bandeja cirurgica',
    'cuba rim',
    'kit cirúrgico', 'kit cirurgico',
    'instrumental cirúrgico', 'instrumental cirurgico',
    'dreno', // também em descartaveis — Set garante unicidade no lookup
  ],

  // Materiais e ambientes de procedimento cirúrgico
  cirurgico: [
    'cirúrgico', 'cirurgico',
    'cirurgia',
    'sala cirúrgica', 'sala cirurgica',
    'centro cirúrgico', 'centro cirurgico',
    'paramentação', 'paramentacao',
    'avental cirúrgico', 'avental cirurgico',
    'cobertura cirúrgica', 'cobertura cirurgica',
    'antisséptico', 'antisseptico',
    'anti-séptico',
    'degermante',
    'barreira estéril', 'barreira esteril',
    'drape cirúrgico', 'drape cirurgico',
    'sutura',
    'material cirúrgico', 'material cirurgico',
    'estéril', 'esteril',
  ],

  // Exames, kits e insumos de diagnóstico clínico-laboratorial
  diagnostico: [
    'diagnóstico', 'diagnostico',
    'laboratório', 'laboratorio',
    'laboratorial',
    'radiologia',
    'teste rápido', 'teste rapido',
    'elisa',
    'imunocromatografia',
    'biópsia', 'biopsia',
    'histologia',
    'patologia',
    'citologia',
    'hematologia',
    'bioquímica', 'bioquimica',
    'urinálise', 'urinalise',
    'hemograma',
    'sorologia',
    'imunologia',
    'microbiologia',
    'bacteriologia',
    'anatomia patológica', 'anatomia patologica',
    'exame laboratorial',
    'glicosímetro', 'glicosimetro',
    'kit diagnóstico', 'kit diagnostico',
    'cultura bacteriana',
    'antibiograma',
  ],

  // Termos amplos de saúde — ampliam cobertura, peso menor
  generico_saude: [
    'hospitalar', 'hospital',
    'ubs', 'unidade básica de saúde', 'unidade basica de saude',
    'pronto-socorro', 'pronto socorro',
    'clínica', 'clinica',
    'ambulatorial',
    'hemocentro',
    'farmácia', 'farmacia',
    'farmacêutico', 'farmaceutico',
    'material médico', 'material medico',
    'material hospitalar',
    'esterilização', 'esterilizacao',
    'uti',
    'hemodiálise', 'hemodialise',
    'hemoterapia',
    'oncologia', 'oncológico', 'oncologico',
    'reabilitação', 'reabilitacao',
    'enfermagem',
    'odontológico', 'odontologico',
    'saúde pública', 'saude publica',
    'epi',
    'epc',
    'ccih',
    'cme',
    'upa',
    'samu',
    'ambulância', 'ambulancia',
    'resíduo hospitalar', 'residuo hospitalar',
    'resíduo infectante', 'residuo infectante',
    'limpeza hospitalar',
    'desinfecção hospitalar', 'desinfeccao hospitalar',
    'desinfetante hospitalar',
    'farmácia hospitalar', 'farmacia hospitalar',
    'vigilância sanitária', 'vigilancia sanitaria',
    'anvisa',
    'atenção básica', 'atencao basica',
    'saúde', 'saude',
  ],
};

// ─── Lista plana para lookup (backward-compatible) ────────────────────────────
// Set elimina duplicatas que aparecem em mais de uma categoria
export const PALAVRAS_SAUDE: string[] = Array.from(
  new Set(Object.values(PALAVRAS_POR_CATEGORIA).flat()),
);

// ─── Funções de lookup — interface pública inalterada ─────────────────────────

export function temPalavraChave(texto: string): boolean {
  const lower = texto.toLowerCase();
  return PALAVRAS_SAUDE.some(p => lower.includes(p));
}

export function encontrarPalavras(texto: string): string[] {
  const lower = texto.toLowerCase();
  return PALAVRAS_SAUDE.filter(p => lower.includes(p));
}
