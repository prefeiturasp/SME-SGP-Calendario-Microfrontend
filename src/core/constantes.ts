export const OPCAO_TODOS = "-99";
export const PERIODO_ANUAL = 1;
export const APLICACAO_SGP = 1;
export const URL_HOME = "/";

export const ROTAS = {
  EVENTOS: "/calendario-escolar/eventos",
  TIPO_FERIADO: "/calendario-escolar/tipo-feriado",
  TIPO_CALENDARIO_ESCOLAR: "/calendario-escolar/tipo-calendario-escolar",
  PERIODOS_ESCOLARES: "/calendario-escolar/periodos-escolares",
  PERIODO_FECHAMENTO_ABERTURA: "/calendario-escolar/periodo-fechamento-abertura",
  PERIODO_FECHAMENTO_REABERTURA: "/calendario-escolar/periodo-fechamento-reabertura",
  TIPO_EVENTOS: '/calendario-escolar/tipo-eventos',
} as const;

export const LocalOcorrencia = {
  UE: 1,
  DRE: 2,
  SME: 3,
  SMEUE: 4,
  TODOS: 5,
} as const;
export type LocalOcorrenciaValor = (typeof LocalOcorrencia)[keyof typeof LocalOcorrencia];

export const StatusEvento = {
  Aprovado: 1,
  AguardandoAprovacao: 2,
  Recusado: 3,
} as const;
export type StatusEventoValor = (typeof StatusEvento)[keyof typeof StatusEvento];

export const EventoLetivo = { Sim: 1, Nao: 2, Opcional: 3 } as const;
export const EventoTipoData = { Unico: 1, InicioFim: 2 } as const;

export const TipoEventoId = {
  Feriado: 4,
  LiberacaoBoletim: 7,
  ReuniaoPedagogica: 16,
  ReuniaoAPM: 17,
  ReuniaoConselhoEscola: 18,
  ItineranciaPAAI: 28,
} as const;

export const ModalidadeTipoCalendario = {
  FUNDAMENTAL_MEDIO: 1,
  EJA: 2,
  INFANTIL: 3,
  CELP: 4,
} as const;

export const Modalidade = {
  INFANTIL: 1,
  EJA: 3,
  FUNDAMENTAL: 5,
  CELP: 10,
} as const;

export type TipoCalendario = {
  id: number;
  descricao: string;
  nome?: string;
  descricaoPeriodo?: string;
  periodo?: number;
  modalidade?: number;
  anoLetivo?: number;
};

export type PermissoesTela = {
  podeConsultar?: boolean;
  podeIncluir?: boolean;
  podeAlterar?: boolean;
  podeExcluir?: boolean;
};

export const ehCalendarioAnual = (tipo?: { periodo?: number } | null) =>
  tipo?.periodo === PERIODO_ANUAL;

export const ehEjaOuCelp = (modalidade?: number) =>
  modalidade === ModalidadeTipoCalendario.EJA ||
  modalidade === ModalidadeTipoCalendario.CELP;

export const comoLista = <T>(valor: unknown): T[] => (Array.isArray(valor) ? valor : []);
