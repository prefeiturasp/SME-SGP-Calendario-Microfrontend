import type { TipoCalendario } from "../constantes";
import { paraDataApi, type ValorData } from "../datas";

export type PeriodoApi = {
  id: number;
  bimestre: number;
  periodoInicio: string | Date;
  periodoFim: string | Date;
};

export type PeriodoEscolarApi = {
  periodos?: PeriodoApi[];
  tipoCalendario?: number;
  anoBase?: number;
  criadoEm?: string;
  criadoPor?: string;
  criadoRF?: string;
  alteradoPor?: string;
  alteradoEm?: string;
  alteradoRF?: string;
};

export type ValoresPeriodo = Record<string, ValorData>;

const chaves = [
  ["primeiroBimestreDataInicial", "primeiroBimestreDataFinal"],
  ["segundoBimestreDataInicial", "segundoBimestreDataFinal"],
  ["terceiroBimestreDataInicial", "terceiroBimestreDataFinal"],
  ["quartoBimestreDataInicial", "quartoBimestreDataFinal"],
] as const;

export const valoresPorBimestre = (periodo?: PeriodoEscolarApi | null): ValoresPeriodo => {
  const valores: ValoresPeriodo = {};
  periodo?.periodos?.forEach((item) => {
    const par = chaves[item.bimestre - 1];
    if (!par) return;
    valores[par[0]] = item.periodoInicio;
    valores[par[1]] = item.periodoFim;
  });
  return valores;
};

export const aplicarDatasNoPeriodo = (
  periodo: PeriodoEscolarApi,
  dados: ValoresPeriodo,
) => {
  periodo.periodos?.forEach((item) => {
    const par = chaves[item.bimestre - 1];
    if (!par) return;
    const inicio = paraDataApi(dados[par[0]]);
    const fim = paraDataApi(dados[par[1]]);
    if (inicio) item.periodoInicio = inicio;
    if (fim) item.periodoFim = fim;
  });
  return periodo;
};

export const montarCadastroPeriodo = (
  calendario: TipoCalendario,
  dados: ValoresPeriodo,
  anual: boolean,
) => {
  const quantidade = anual ? 4 : 2;
  const periodos = Array.from({ length: quantidade }, (_, indice) => {
    const par = chaves[indice];
    return {
      id: 0,
      bimestre: indice + 1,
      periodoInicio: paraDataApi(dados[par[0]]),
      periodoFim: paraDataApi(dados[par[1]]),
    };
  });

  return {
    periodos,
    tipoCalendario: calendario.id,
    anoBase: calendario.anoLetivo,
  };
};
