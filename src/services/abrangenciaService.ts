import type { Abrangencia } from "../core/regras/reabertura";
import { getSgp } from "../core/servico/apiSgp";

export const abrangenciaService = {
  buscarDres: (consideraHistorico = false) =>
    getSgp<Abrangencia[]>(`/v1/abrangencias/${consideraHistorico}/dres`),
  buscarUes: (
    dreId: string,
    modalidade?: number | null,
    consideraHistorico = true,
    anoLetivo?: number,
  ) =>
    getSgp<Abrangencia[]>(
      `/v1/abrangencias/${consideraHistorico}/dres/${dreId}/ues`,
      {
        params: {
          ...(modalidade ? { modalidade } : {}),
          ...(anoLetivo ? { anoLetivo } : {}),
        },
      },
    ),
};
