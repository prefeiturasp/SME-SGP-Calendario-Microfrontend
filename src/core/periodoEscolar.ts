import type { TipoCalendario } from "./constantes";
import type { ValorData } from "./datas";
import type { PeriodoEscolarApi } from "./regras/periodoEscolar";

export type CadastroPeriodosEscolares = {
  tipoCalendario: number | string;
  anoBase?: number;
  periodos: {
    id?: number;
    bimestre: number;
    periodoInicio: ValorData;
    periodoFim: ValorData;
  }[];
};

// Contrato de apresentação: um adaptador de BFF pode substituir o mock no serviço.
export type FontePeriodosEscolares = {
  listarCalendarios: (pesquisa?: string) => Promise<TipoCalendario[]>;
  obterPorTipoCalendario: (
    id: number | string
  ) => Promise<PeriodoEscolarApi | null>;
  salvar: (dados: CadastroPeriodosEscolares) => Promise<PeriodoEscolarApi>;
};
