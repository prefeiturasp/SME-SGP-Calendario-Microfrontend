import type { Abrangencia } from "../core/regras/reabertura";
import { getSgp } from "../core/servico/apiSgp";

export const abrangenciaService = {
  buscarTodosAnosLetivos: (consideraHistorico = false) =>
    getSgp<Array<string | number>>(
      `/v1/abrangencias/${consideraHistorico}/anos-letivos-todos`,
    ),
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
