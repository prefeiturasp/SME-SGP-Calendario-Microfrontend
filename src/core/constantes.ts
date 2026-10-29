export const OPCAO_TODOS = "-99";
export const PERIODO_ANUAL = 1;
export const APLICACAO_SGP = 1;
export const URL_HOME = "/";

export const ROTAS = {
  PERIODOS_ESCOLARES: "/calendario-escolar/periodos-escolares",
  PERIODO_FECHAMENTO_ABERTURA: "/calendario-escolar/periodo-fechamento-abertura",
  PERIODO_FECHAMENTO_REABERTURA: "/calendario-escolar/periodo-fechamento-reabertura",
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
