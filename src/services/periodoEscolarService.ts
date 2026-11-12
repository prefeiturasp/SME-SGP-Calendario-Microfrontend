import type { PeriodoEscolarApi } from "../core/regras/periodoEscolar";
import { getSgp, postSgp } from "../core/servico/apiSgp";

export const periodoEscolarService = {
  obterPorTipoCalendario: (codigoTipoCalendario: number | string) =>
    getSgp<PeriodoEscolarApi>("v1/periodo-escolar", {
      params: { codigoTipoCalendario },
    }),
  salvar: (payload: unknown) => postSgp("v1/periodo-escolar", payload),
};
