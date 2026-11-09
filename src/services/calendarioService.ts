import {
  Modalidade,
  ModalidadeTipoCalendario,
  type TipoCalendario,
} from "../core/constantes";
import { deleteSgp, getSgp } from "../core/servico/apiSgp";

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

export const calendarioService = {
  converterModalidade,
  listarTiposCalendario: () => getSgp<TipoCalendario[]>("v1/calendarios/tipos"),
  excluirTiposCalendario: (ids: Array<string | number>) =>
    deleteSgp("v1/calendarios/tipos", ids),
  obterTiposCalendarioAutoComplete: (descricao = "") =>
    getSgp<TipoCalendario[]>(
      `v1/calendarios/tipos/anos-letivos?descricao=${encodeURIComponent(descricao)}`,
    ),
};
