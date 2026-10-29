import {
  Modalidade,
  ModalidadeTipoCalendario,
  type TipoCalendario,
} from "../core/constantes";
import { getSgp } from "../core/servico/apiSgp";

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
  obterTiposCalendarioAutoComplete: (descricao = "") =>
    getSgp<TipoCalendario[]>(
      `v1/calendarios/tipos/anos-letivos?descricao=${encodeURIComponent(descricao)}`,
    ),
};
