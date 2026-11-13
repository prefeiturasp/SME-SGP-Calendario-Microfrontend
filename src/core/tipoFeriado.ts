export type AbrangenciaFeriado = 1 | 2 | 3;
export type TipoFeriado = 1 | 2;

export const ABRANGENCIAS_FERIADO = [
  { value: 1, label: "Nacional" },
  { value: 2, label: "Estadual" },
  { value: 3, label: "Municipal" },
] as const;

export const TIPOS_FERIADO = [
  { value: 1, label: "Fixo" },
  { value: 2, label: "Móvel" },
] as const;

export type ConsultaTiposFeriado = {
  nome: string;
  abrangencia: 0 | AbrangenciaFeriado;
  tipo: 0 | TipoFeriado;
  pagina: number;
  tamanhoPagina: number;
};

export type TipoFeriadoResumo = {
  id: number;
  nome: string;
  descricaoAbrangencia: string;
  descricaoTipo: string;
};

export type PaginaTiposFeriado = {
  itens: TipoFeriadoResumo[];
  total: number;
};

export type FonteTiposFeriado = {
  listar: (consulta: ConsultaTiposFeriado) => Promise<PaginaTiposFeriado>;
};
