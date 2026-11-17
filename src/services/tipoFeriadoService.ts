import type { FonteTiposFeriado } from "../core/tipoFeriado";
import { listarTiposFeriadoMock } from "../mocks/tipoFeriadoMock";

// O adaptador de API/BFF deve preservar este contrato de apresentação.
export const tipoFeriadoService: FonteTiposFeriado = {
  listar: listarTiposFeriadoMock,
};
