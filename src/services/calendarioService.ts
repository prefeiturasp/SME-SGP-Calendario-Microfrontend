import {
  Modalidade,
  ModalidadeTipoCalendario,
  type TipoCalendario,
} from "../core/constantes";
import { deleteSgp, getSgp, postSgp, putSgp } from "../core/servico/apiSgp";

const converterModalidade = (modalidadeCalendario?: number) => {
  switch (modalidadeCalendario) {
    case ModalidadeTipoCalendario.EJA:
      return Modalidade.EJA;
    case ModalidadeTipoCalendario.CELP:
      return Modalidade.CELP;
    case ModalidadeTipoCalendario.INFANTIL:
      return Modalidade.INFANTIL;
    case ModalidadeTipoCalendario.FUNDAMENTAL_MEDIO:
      return Modalidade.FUNDAMENTAL;
    default:
      return null;
  }
};

export type TipoCalendarioDetalhe = TipoCalendario & {
  nome: string;
  situacao: boolean;
  semestre?: number;
  possuiEventos?: boolean;
  criadoPor?: string;
  criadoRF?: number;
  criadoEm?: string;
  alteradoPor?: string;
  alteradoRF?: number;
  alteradoEm?: string;
};

export type CadastroTipoCalendario = {
  id: number | string;
  anoLetivo: number | string;
  nome: string;
  modalidade: string;
  periodo: number;
  situacao: boolean;
  semestre: number | string | null;
};

export const calendarioService = {
  converterModalidade,
  listarTiposCalendario: () => getSgp<TipoCalendario[]>("v1/calendarios/tipos"),
  obterTipoCalendario: (id: number | string) =>
    getSgp<TipoCalendarioDetalhe>(`v1/calendarios/tipos/${id}`),
  salvarTipoCalendario: (dados: CadastroTipoCalendario) => {
    if (dados.id) {
      return putSgp(`v1/calendarios/tipos/${dados.id}`, dados);
    }
    return postSgp("v1/calendarios/tipos", dados);
  },
  excluirTiposCalendario: (ids: Array<string | number>) =>
    deleteSgp("v1/calendarios/tipos", ids),
  obterTiposCalendarioAutoComplete: (descricao = "") =>
    getSgp<TipoCalendario[]>(
      `v1/calendarios/tipos/anos-letivos?descricao=${encodeURIComponent(descricao)}`,
    ),
};
