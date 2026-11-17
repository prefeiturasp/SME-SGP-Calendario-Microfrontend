import { APLICACAO_SGP } from "../core/constantes";
import type { FechamentoAbertura } from "../core/regras/fechamentoAbertura";
import { getSgp, postSgp } from "../core/servico/apiSgp";

export const periodoFechamentoService = {
  obterPorTipoCalendario: (tipoCalendarioId: number | string) =>
    getSgp<FechamentoAbertura>(
      `/v1/periodos/fechamentos/aberturas?tipoCalendarioId=${tipoCalendarioId}&aplicacao=${APLICACAO_SGP}`,
    ),
  salvar: (fechamento: unknown) =>
    postSgp("/v1/periodos/fechamentos/aberturas", {
      ...(fechamento as object),
      aplicacao: APLICACAO_SGP,
    }),
};
