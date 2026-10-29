import { deleteSgp, getSgp, postSgp, putSgp } from "../core/servico/apiSgp";

const urlPadrao = "v1/fechamentos/reaberturas";

export type ReaberturaDetalhe = {
  id: number;
  tipoCalendarioId: number;
  dreCodigo?: string;
  ueCodigo?: string;
  dataInicio: string;
  dataFim: string;
  descricao: string;
  bimestres: boolean[];
  aplicacao?: number;
  aprovadoEm?: string;
  aprovadoPor?: string;
  criadoPor?: string;
  criadoRf?: string;
  criadoEm?: string;
  alteradoPor?: string;
  alteradoRf?: string;
  alteradoEm?: string;
};

export type ListaReabertura = {
  items: ReaberturaDetalhe[];
  totalRegistros: number;
};

export const fechamentoReaberturaService = {
  listar: (
    pagina: number,
    registros: number,
    filtro: Record<string, unknown>,
  ) =>
    getSgp<ListaReabertura>(
      `${urlPadrao}?numeroPagina=${pagina}&numeroRegistros=${registros}`,
      { params: filtro },
    ),
  obterPorId: (id: string | number) => getSgp<ReaberturaDetalhe>(`${urlPadrao}/${id}`),
  salvar: (parametros: Record<string, unknown>) => {
    if (parametros.id) return putSgp(`${urlPadrao}/${String(parametros.id)}`, parametros);
    return postSgp(urlPadrao, parametros);
  },
  deletar: (ids: Array<string | number>) => deleteSgp(urlPadrao, ids),
};
